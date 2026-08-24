import config from '@/config/config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type {
  NewPracticePhase,
  PracticeSessionType,
} from '@/types/practice-session.types';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { Entity } from 'dexie';
import type { UserItemLocal } from '@/types/user-item.types';
import UserScore from './user-scores';
import UserItem from './user-items';
import UserBlock from './user-blocks';

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
  started_at!: string;
  updated_at!: string;

  static async getActive(userId: string): Promise<PracticeSessionType | null> {
    assertNonEmptyString(userId, 'userId');
    return (await db.practice_sessions.get(userId)) ?? null;
  }

  /** Reads the active session and hides an unusable new-block session without mutating storage. */
  static async inspectActive(userId: string): Promise<ActivePracticeSessionState> {
    assertNonEmptyString(userId, 'userId');

    const session = await this.getActive(userId);
    if (!session || session.mode === 'review') {
      return { activeSession: session, requiresReconciliation: false };
    }

    const blockId = session.block_id;
    const block = blockId == null ? null : await db.user_blocks.get([userId, blockId]);
    const items =
      blockId == null
        ? []
        : await db.user_items.where('[user_id+block_id]').equals([userId, blockId]).toArray();
    const blockItemIds = new Set(items.map((item) => item.item_id));
    const savedItemIds = [
      ...session.current_queue_item_ids,
      ...session.retry_queue_item_ids,
      ...session.completed_item_ids,
    ];
    const hasPendingItems =
      session.current_queue_item_ids.length > 0 || session.retry_queue_item_ids.length > 0;
    const referencesOnlyBlockItems = savedItemIds.every((itemId) => blockItemIds.has(itemId));
    const isValid = Boolean(
      block?.is_practice_block &&
        block.started_at === config.database.nullReplacementDate &&
        blockItemIds.size > 0 &&
        hasPendingItems &&
        referencesOnlyBlockItems,
    );

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
      db.user_blocks,
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
      started_at: dateTime,
      updated_at: dateTime,
    };
    await db.practice_sessions.put(session);
    return session;
  }

  static async startNew(
    userId: string,
    blockId: number,
    itemIds: number[],
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<PracticeSessionType> {
    if (itemIds.length === 0) {
      throw new Error('New-block practice requires at least one item.');
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

        const updatedItemCount = await db.user_items.update([item.user_id, item.item_id], {
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
        if (updatedItemCount !== 1) {
          throw new Error('The reviewed item no longer exists locally.');
        }
        const completedCount = session.completed_count + 1;
        const earnedStar = completedCount === session.target_count;
        await db.practice_sessions.put({
          ...session,
          completed_count: completedCount,
          updated_at: dateTime,
        });
        const starCount = earnedStar ? await UserScore.addStar(item.user_id, 1, dateTime) : null;

        return { completedCount, earnedStar, starCount };
      },
    );
  }

  /** Resets a completed review session for another twenty-answer star. */
  static async continueReview(
    userId: string,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<void> {
    const session = await this.getActive(userId);
    if (session?.mode !== 'review' || session.completed_count < session.target_count) return;
    await db.practice_sessions.put({ ...session, completed_count: 0, updated_at: dateTime });
  }

  /** Atomically completes a new block, awards its star, and removes the local session. */
  static async completeNewBlock(
    userId: string,
    blockId: number,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<number> {
    return db.transaction(
      'rw',
      db.user_items,
      db.user_blocks,
      db.user_scores,
      db.practice_sessions,
      async () => {
        const session = await this.getActive(userId);
        if (session?.mode !== 'new' || session.block_id !== blockId) {
          throw new Error('New-block completion requires its active local session.');
        }

        await UserItem.saveNewBlockCompletion(userId, blockId, dateTime);
        await UserBlock.completeNewBlock(userId, blockId, dateTime);
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
