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
import UserItemProgressHistory from './user-item-progress-history';
import UserItem from './user-items';
import { getEffectiveProgress, getProgressChange, getSrsLength } from '@/utils/progress.utils';

export type PracticeAnswerResult = {
  completedCount: number;
  progressChange: number;
};

export type ActivePracticeSessionState = {
  activeSession: PracticeSessionType | null;
  requiresReconciliation: boolean;
};

function getSavedItemIds(session: PracticeSessionType): number[] {
  return [
    ...session.current_queue_item_ids,
    ...session.retry_queue_item_ids,
    ...session.completed_item_ids,
  ];
}

function hasExpectedBlockItems(items: UserItemLocal[], sessionBlockId: number | null): boolean {
  return items.every((item) => {
    const itemBlockId =
      item.block_id === config.database.nullReplacementNumber ? null : item.block_id;
    return itemBlockId === sessionBlockId;
  });
}

function hasExistingItems(itemIds: number[], items: UserItemLocal[]): boolean {
  const itemById = new Map(items.map((item) => [item.item_id, item]));
  return itemIds.every((itemId) => {
    const item = itemById.get(itemId);
    return item?.deleted_at === config.database.nullReplacementDate;
  });
}

function hasConsistentAutomaticBatch(
  session: PracticeSessionType,
  items: UserItemLocal[],
): boolean {
  if (session.block_id != null) return true;

  const firstItem = items[0];
  if (!firstItem) return false;
  if (items.length > config.practice.initialTrainingBatchSize) return false;

  return items.every(
    (item) =>
      item.lesson_id === firstItem.lesson_id && item.is_vocabulary === firstItem.is_vocabulary,
  );
}

function isValidInitialTrainingSession(
  session: PracticeSessionType,
  savedItemIds: number[],
  items: UserItemLocal[],
  blockExists: boolean,
): boolean {
  const uniqueItemIds = [...new Set(savedItemIds)];
  const hasPendingItems =
    session.current_queue_item_ids.length > 0 || session.retry_queue_item_ids.length > 0;
  const hasValidPhase = session.phase === 0 || session.phase === 1;
  const checks = [
    uniqueItemIds.length > 0,
    uniqueItemIds.length === savedItemIds.length,
    hasPendingItems,
    hasValidPhase,
    blockExists,
    hasExistingItems(uniqueItemIds, items),
    hasExpectedBlockItems(items, session.block_id),
    hasConsistentAutomaticBatch(session, items),
  ];
  return checks.every(Boolean);
}

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
  review_direction?: PracticeDirection;
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

    const savedItemIds = getSavedItemIds(session);
    const uniqueItemIds = [...new Set(savedItemIds)];
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(uniqueItemIds.map((itemId) => [userId, itemId]))
      .toArray();
    const blockExists =
      session.block_id == null || (await db.blocks.get(session.block_id)) !== undefined;
    const isValid = isValidInitialTrainingSession(session, savedItemIds, items, blockExists);

    return {
      activeSession: isValid ? session : null,
      requiresReconciliation: !isValid,
    };
  }

  /** Removes an unusable new-block session and returns the remaining active session. */
  static async reconcileActive(userId: string): Promise<PracticeSessionType | null> {
    assertNonEmptyString(userId, 'userId');

    return db.transaction('rw', db.practice_sessions, db.blocks, db.user_items, async () => {
      const state = await this.inspectActive(userId);
      if (!state.requiresReconciliation) return state.activeSession;
      await db.practice_sessions.delete(userId);
      return null;
    });
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
      target_count: 0,
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

  /** Atomically stores one review answer, advances the session, and records its progress change. */
  static async recordReviewAnswer(
    originalItem: UserItemLocal,
    item: UserItemLocal,
    direction: PracticeDirection,
    dateTime: string,
  ): Promise<PracticeAnswerResult> {
    return db.transaction(
      'rw',
      db.user_items,
      db.practice_sessions,
      db.user_item_progress_history,
      async () => {
        const session = await this.getActive(originalItem.user_id);
        if (session?.mode !== 'review') {
          throw new Error('Review answer requires an active review session.');
        }
        if (!session.review_queue || session.review_queue.length === 0) {
          throw new Error('The active review session is already complete.');
        }

        const updatedItemCount = await updateStoredPracticeItem(item);
        if (updatedItemCount !== 1) {
          throw new Error('The reviewed item no longer exists locally.');
        }
        const completedCount = session.completed_count + 1;
        const nextSession: PracticeSessionType = {
          ...session,
          completed_count: completedCount,
          updated_at: dateTime,
          review_queue: removeReviewQueueEntry(session.review_queue, item.item_id, direction),
        };
        await db.practice_sessions.put(nextSession);
        const progressChange = await recordProgressChange(originalItem, item, direction, dateTime);

        return { completedCount, progressChange };
      },
    );
  }

  /** Atomically stores one initial-training answer and advances its session. */
  static async recordInitialTrainingAnswer(
    originalItem: UserItemLocal,
    item: UserItemLocal,
    direction: PracticeDirection,
    session: PracticeSessionType,
  ): Promise<void> {
    await db.transaction(
      'rw',
      db.user_items,
      db.practice_sessions,
      db.user_item_progress_history,
      async () => {
        if (session.user_id !== item.user_id || session.mode !== 'new') {
          throw new Error('Initial-training answer contains an invalid session.');
        }
        // The availability observer can remove a stale-looking row while this page is open.
        // The session held by the active deck is the authoritative continuation state.
        const activeSession = await this.getActive(item.user_id);
        if (activeSession && activeSession.mode !== 'new') {
          throw new Error('Initial-training answer requires an active new session.');
        }

        const updatedItemCount = await updateStoredPracticeItem(item);
        if (updatedItemCount !== 1) {
          throw new Error('The trained item no longer exists locally.');
        }
        await db.practice_sessions.put(session);
        await recordProgressChange(originalItem, item, direction, item.updated_at);
      },
    );
  }

  /** Atomically completes initial training, records final progress changes, and removes the session. */
  static async completeInitialTraining(
    userId: string,
    itemIds: readonly number[],
    dateTime: string = new Date(Date.now()).toISOString(),
    finalItem?: UserItemLocal,
    finalDirection: PracticeDirection = 'enToCz',
    expectedSession?: PracticeSessionType,
  ): Promise<void> {
    return db.transaction(
      'rw',
      db.user_items,
      db.user_item_progress_history,
      db.practice_sessions,
      async () => {
        const storedSession = await this.getActive(userId);
        // Keep completion recoverable when the active row disappeared after the last answer.
        const session = storedSession ?? expectedSession;
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
          const originalFinalItem = await db.user_items.get([userId, finalItem.item_id]);
          if (!originalFinalItem) {
            throw new Error('The final trained item no longer exists locally.');
          }
          const updatedItemCount = await updateStoredPracticeItem(finalItem);
          if (updatedItemCount !== 1) {
            throw new Error('The final trained item no longer exists locally.');
          }
          await recordProgressChange(originalFinalItem, finalItem, finalDirection, dateTime);
        }
        await UserItem.saveInitialTrainingCompletion(userId, itemIds, dateTime);
        await db.practice_sessions.delete(userId);
      },
    );
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db.practice_sessions.delete(userId);
  }
}

async function recordProgressChange(
  originalItem: UserItemLocal,
  updatedItem: UserItemLocal,
  direction: PracticeDirection,
  dateTime: string,
): Promise<number> {
  const progressChange = getProgressChange(originalItem, updatedItem, direction);
  await UserItemProgressHistory.recordChange(
    updatedItem.user_id,
    updatedItem.item_id,
    direction,
    getEffectiveProgress(updatedItem, direction),
    getSrsLength(direction),
    progressChange,
    dateTime,
  );
  return progressChange;
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
    started_at: item.started_at,
    updated_at: item.updated_at,
    next_at_cz_to_en: item.next_at_cz_to_en,
    next_at_en_to_cz: item.next_at_en_to_cz,
    mastered_at_cz_to_en: item.mastered_at_cz_to_en,
    mastered_at_en_to_cz: item.mastered_at_en_to_cz,
  });
}
