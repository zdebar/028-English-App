import config from '@/config/config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type {
  NewPracticePhase,
  PracticeSessionType,
  ReviewQueueEntry,
} from '@/types/practice-session.types';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { Entity } from 'dexie';
import type { PracticeDirection, UserItemLocal } from '@/types/user-item.types';
import UserScore from './user-scores';
import UserItem from './user-items';

export type ReviewAnswerResult = {
  completedCount: number;
  earnedStar: boolean;
  starCount: number | null;
};

export type ActivePracticeSessionState = {
  activeSession: PracticeSessionType | null;
  requiresReconciliation: boolean;
};

export default class PracticeSession extends Entity<AppDB> implements PracticeSessionType {
  user_id!: string;
  mode!: 'review' | 'new';
  completed_count!: number;
  target_count!: number;
  block_id!: number | null;
  phase!: NewPracticePhase | null;
  current_queue_item_ids!: number[];
  retry_queue_item_ids!: number[];
  completed_item_ids!: number[];
  review_queue?: ReviewQueueEntry[];
  started_at!: string;
  updated_at!: string;

  static async getActive(userId: string): Promise<PracticeSessionType | null> {
    assertNonEmptyString(userId, 'userId');
    return (await db.practice_sessions.get(userId)) ?? null;
  }

  /** Reads the active session and hides an unusable initial-training session without mutating storage. */
  static async inspectActive(userId: string): Promise<ActivePracticeSessionState> {
    assertNonEmptyString(userId, 'userId');

    const session = await this.getActive(userId);
    if (!session || session.mode === 'review') {
      return { activeSession: session, requiresReconciliation: false };
    }

    const savedItemIds = [
      ...session.current_queue_item_ids,
      ...session.retry_queue_item_ids,
      ...session.completed_item_ids,
    ];
    const uniqueItemIds = [...new Set(savedItemIds)];
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(uniqueItemIds.map((itemId) => [userId, itemId]))
      .toArray();
    const itemById = new Map(items.map((item) => [item.item_id, item]));
    const blockExists =
      session.block_id == null || (await db.blocks.get(session.block_id)) !== undefined;
    const hasPendingItems =
      session.current_queue_item_ids.length > 0 || session.retry_queue_item_ids.length > 0;
    const hasValidPhase = session.phase === 0 || session.phase === 1;
    const referencesExistingItems = uniqueItemIds.every((itemId) => {
      const item = itemById.get(itemId);
      return item?.deleted_at === config.database.nullReplacementDate;
    });
    const referencesExpectedBlock = items.every((item) => {
      const itemBlockId = item.block_id === config.database.nullReplacementNumber ? null : item.block_id;
      return itemBlockId === session.block_id;
    });
    const firstItem = items[0];
    const hasConsistentAutomaticBatch =
      session.block_id != null ||
      (firstItem != null &&
        items.length <= config.practice.initialTrainingBatchSize &&
        items.every(
          (item) =>
            item.lesson_id === firstItem.lesson_id &&
            item.is_vocabulary === firstItem.is_vocabulary,
        ));
    const isValid =
      uniqueItemIds.length > 0 &&
      uniqueItemIds.length === savedItemIds.length &&
      hasPendingItems &&
      hasValidPhase &&
      blockExists &&
      referencesExistingItems &&
      referencesExpectedBlock &&
      hasConsistentAutomaticBatch;

    return {
      activeSession: isValid ? session : null,
      requiresReconciliation: !isValid,
    };
  }

  /** Removes an unusable new-block session and returns the remaining active session. */
  static async reconcileActive(userId: string): Promise<PracticeSessionType | null> {
    assertNonEmptyString(userId, 'userId');

    return db.transaction(
      'rw',
      db.practice_sessions,
      db.blocks,
      db.user_items,
      async () => {
        const state = await this.inspectActive(userId);
        if (!state.requiresReconciliation) return state.activeSession;
        await db.practice_sessions.delete(userId);
        return null;
      },
    );
  }

  static async startReview(
    userId: string,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<PracticeSessionType> {
    const existing = await this.getActive(userId);
    if (existing) return existing;

    const session: PracticeSessionType = {
      user_id: userId,
      mode: 'review',
      completed_count: 0,
      target_count: config.practice.reviewStarSize,
      block_id: null,
      phase: null,
      current_queue_item_ids: [],
      retry_queue_item_ids: [],
      completed_item_ids: [],
      review_queue: [],
      started_at: dateTime,
      updated_at: dateTime,
    };
    await db.practice_sessions.put(session);
    return session;
  }

  static async startNew(
    userId: string,
    blockId: number | null,
    itemIds: number[],
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<PracticeSessionType> {
    if (itemIds.length === 0) {
      throw new Error('Initial training requires at least one item.');
    }
    const existing = await this.getActive(userId);
    if (existing) return existing;

    const session: PracticeSessionType = {
      user_id: userId,
      mode: 'new',
      completed_count: 0,
      target_count: itemIds.length,
      block_id: blockId,
      phase: 0,
      current_queue_item_ids: itemIds,
      retry_queue_item_ids: [],
      completed_item_ids: [],
      started_at: dateTime,
      updated_at: dateTime,
    };
    await db.practice_sessions.put(session);
    return session;
  }

  static async put(session: PracticeSessionType): Promise<void> {
    await db.practice_sessions.put(session);
  }

  /** Atomically stores one review answer, advances the session, and awards its final star. */
  static async recordReviewAnswer(
    item: UserItemLocal,
    direction: PracticeDirection,
    dateTime: string,
  ): Promise<ReviewAnswerResult> {
    return db.transaction(
      'rw',
      db.user_items,
      db.practice_sessions,
      db.user_scores,
      async () => {
        const session = await this.getActive(item.user_id);
        if (session?.mode !== 'review') {
          throw new Error('Review answer requires an active review session.');
        }
        if (session.completed_count >= session.target_count) {
          throw new Error('The active review session is already complete.');
        }

        const updatedItemCount = await updateStoredPracticeItem(item);
        if (updatedItemCount !== 1) {
          throw new Error('The reviewed item no longer exists locally.');
        }
        const completedCount = session.completed_count + 1;
        const earnedStar = completedCount === session.target_count;
        const nextSession: PracticeSessionType = {
          ...session,
          completed_count: completedCount,
          updated_at: dateTime,
        };
        const remainingReviewQueue = removeReviewQueueEntry(
          session.review_queue,
          item.item_id,
          direction,
        );
        if (remainingReviewQueue) nextSession.review_queue = remainingReviewQueue;
        await db.practice_sessions.put(nextSession);
        const starCount = earnedStar ? await UserScore.addStar(item.user_id, 1, dateTime) : null;

        return { completedCount, earnedStar, starCount };
      },
    );
  }

  /** Atomically stores one initial-training answer and advances its session. */
  static async recordInitialTrainingAnswer(
    item: UserItemLocal,
    session: PracticeSessionType,
  ): Promise<void> {
    await db.transaction(
      'rw',
      db.user_items,
      db.practice_sessions,
      async () => {
        const activeSession = await this.getActive(item.user_id);
        if (activeSession?.mode !== 'new') {
          throw new Error('Initial-training answer requires an active new session.');
        }
        if (session.user_id !== item.user_id || session.mode !== 'new') {
          throw new Error('Initial-training answer contains an invalid session.');
        }

        const updatedItemCount = await updateStoredPracticeItem(item);
        if (updatedItemCount !== 1) {
          throw new Error('The trained item no longer exists locally.');
        }
        await db.practice_sessions.put(session);
      },
    );
  }

  /** Resets a completed review session for another twenty-answer star. */
  static async continueReview(
    userId: string,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<PracticeSessionType | null> {
    const session = await this.getActive(userId);
    if (session?.mode !== 'review' || session.completed_count < session.target_count) return null;
    const continuedSession: PracticeSessionType = {
      ...session,
      completed_count: 0,
      target_count: config.practice.reviewStarSize,
      review_queue: [],
      updated_at: dateTime,
    };
    await db.practice_sessions.put(continuedSession);
    return continuedSession;
  }

  /** Atomically completes initial training, awards its star, and removes the local session. */
  static async completeInitialTraining(
    userId: string,
    itemIds: readonly number[],
    dateTime: string = new Date(Date.now()).toISOString(),
    finalItem?: UserItemLocal,
  ): Promise<number> {
    return db.transaction(
      'rw',
      db.user_items,
      db.user_scores,
      db.practice_sessions,
      async () => {
        const session = await this.getActive(userId);
        if (session?.mode !== 'new') {
          throw new Error('Initial-training completion requires its active local session.');
        }

        const sessionItemIds = new Set([
          ...session.current_queue_item_ids,
          ...session.retry_queue_item_ids,
          ...session.completed_item_ids,
        ]);
        const completionItemIds = new Set(itemIds);
        const referencesExactSession =
          sessionItemIds.size === completionItemIds.size &&
          [...sessionItemIds].every((itemId) => completionItemIds.has(itemId));
        if (!referencesExactSession) {
          throw new Error('Initial-training completion must match its saved item queue.');
        }

        if (finalItem) {
          const updatedItemCount = await updateStoredPracticeItem(finalItem);
          if (updatedItemCount !== 1) {
            throw new Error('The final trained item no longer exists locally.');
          }
        }
        await UserItem.saveInitialTrainingCompletion(userId, itemIds, dateTime);
        const starCount = await UserScore.addStar(userId, 1, dateTime);
        await db.practice_sessions.delete(userId);
        return starCount;
      },
    );
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db.practice_sessions.delete(userId);
  }
}

function removeReviewQueueEntry(
  queue: ReviewQueueEntry[] | undefined,
  itemId: number,
  direction: PracticeDirection,
): ReviewQueueEntry[] | undefined {
  if (!queue) return undefined;
  return queue.filter((entry) => entry.item_id !== itemId || entry.direction !== direction);
}

async function updateStoredPracticeItem(item: UserItemLocal): Promise<number> {
  return db.user_items.update([item.user_id, item.item_id], {
    progress_cz_to_en: item.progress_cz_to_en,
    progress_en_to_cz: item.progress_en_to_cz,
    progress_history: item.progress_history,
    started_at: item.started_at,
    updated_at: item.updated_at,
    next_at_cz_to_en: item.next_at_cz_to_en,
    next_at_en_to_cz: item.next_at_en_to_cz,
    mastered_at_cz_to_en: item.mastered_at_cz_to_en,
    mastered_at_en_to_cz: item.mastered_at_en_to_cz,
  });
}
