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
import UserLesson from './user-lessons';
import UserSettings from './user-settings';

export type ActivePracticeSessionState = {
  activeSession: PracticeSessionType | null;
  requiresReconciliation: boolean;
};

function isValidInitialTrainingAnswerSession(
  session: PracticeSessionType | null,
  item: UserItemLocal,
): boolean {
  return (
    session?.user_id === item.user_id &&
    session.mode === 'new' &&
    session.phase === 0
  );
}

function assertValidInitialTrainingSession(
  session: PracticeSessionType | null,
  item: UserItemLocal,
): void {
  if (!isValidInitialTrainingAnswerSession(session, item)) {
    throw new Error('Initial-training answer contains an invalid session.');
  }
}

function assertActiveInitialTrainingSession(session: PracticeSessionType | null): void {
  if (session && session.mode !== 'new') {
    throw new Error('Initial-training answer requires an active new session.');
  }
}

function getSavedItemIds(session: PracticeSessionType): number[] {
  return [
    ...session.current_queue_item_ids,
    ...session.retry_queue_item_ids,
    ...session.completed_item_ids,
  ];
}

function hasExistingItems(itemIds: number[], items: UserItemLocal[]): boolean {
  const itemById = new Map(items.map((item) => [item.item_id, item]));
  return itemIds.every((itemId) => {
    const item = itemById.get(itemId);
    return item?.deleted_at === config.database.nullReplacementDate;
  });
}

function hasConsistentLessonBatch(
  session: PracticeSessionType,
  items: UserItemLocal[],
): boolean {
  return session.lesson_id != null && items.every((item) => item.lesson_id === session.lesson_id);
}

function isValidInitialTrainingSession(
  session: PracticeSessionType,
  savedItemIds: number[],
  items: UserItemLocal[],
): boolean {
  const uniqueItemIds = [...new Set(savedItemIds)];
  const hasPendingItems =
    session.current_queue_item_ids.length > 0 || session.retry_queue_item_ids.length > 0;
  const hasValidPhase = session.phase === 0;
  const checks = [
    uniqueItemIds.length > 0,
    uniqueItemIds.length === savedItemIds.length,
    hasPendingItems,
    hasValidPhase,
    hasExistingItems(uniqueItemIds, items),
    hasConsistentLessonBatch(session, items),
  ];
  return checks.every(Boolean);
}

export default class PracticeSession extends Entity<AppDB> implements PracticeSessionType {
  user_id!: string;
  mode!: 'review' | 'new';
  completed_count!: number;
  target_count!: number;
  lesson_id!: number | null;
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

  /** Reads the active session and hides an unusable initial-training session without mutating storage. */
  static async inspectActive(userId: string): Promise<ActivePracticeSessionState> {
    assertNonEmptyString(userId, 'userId');

    const session = await this.getActive(userId);
    if (!session) return { activeSession: null, requiresReconciliation: false };
    if (session.mode === 'review') {
      return { activeSession: null, requiresReconciliation: true };
    }

    const savedItemIds = getSavedItemIds(session);
    const uniqueItemIds = [...new Set(savedItemIds)];
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(uniqueItemIds.map((itemId) => [userId, itemId]))
      .toArray();
    const isValid = isValidInitialTrainingSession(session, savedItemIds, items);

    return {
      activeSession: isValid ? session : null,
      requiresReconciliation: !isValid,
    };
  }

  /** Removes an unusable initial-training session and returns the remaining active session. */
  static reconcileActive(userId: string): Promise<PracticeSessionType | null> {
    assertNonEmptyString(userId, 'userId');

    return db.transaction('rw', db.practice_sessions, db.user_items, async () => {
      const state = await this.inspectActive(userId);
      if (!state.requiresReconciliation) return state.activeSession;
      await db.practice_sessions.delete(userId);
      return null;
    });
  }

  static async startNew(
    userId: string,
    lessonId: number,
    itemIds: number[],
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<PracticeSessionType> {
    if (itemIds.length === 0) {
      throw new Error('Initial training requires at least one item.');
    }
    return db.transaction(
      'rw',
      db.practice_sessions,
      db.user_items,
      db.user_lessons,
      db.users,
      async () => {
        const existing = await this.getActive(userId);
        if (existing) return existing;

        const items = await db.user_items
          .where('[user_id+item_id]')
          .anyOf(itemIds.map((itemId) => [userId, itemId]))
          .toArray();
        if (items.length !== itemIds.length || items.some((item) => item.lesson_id !== lessonId)) {
          throw new Error('Initial training must contain items from one lesson.');
        }

        const settings = await UserSettings.getOrCreate(userId);
        const startedCount = await UserLesson.getStartedCountForToday(userId, new Date(dateTime));
        if (startedCount >= settings.max_new_lessons_per_day) {
          throw new Error('Daily new lesson limit reached.');
        }

        const session: PracticeSessionType = {
          user_id: userId,
          mode: 'new',
          completed_count: 0,
          target_count: itemIds.length,
          lesson_id: lessonId,
          phase: 0,
          current_queue_item_ids: itemIds,
          retry_queue_item_ids: [],
          completed_item_ids: [],
          started_at: dateTime,
          updated_at: dateTime,
        };
        await db.practice_sessions.put(session);
        await UserLesson.recordStart(userId, lessonId, dateTime);
        return session;
      },
    );
  }

  /** Atomically stores one initial-training answer and advances its session. */
  static async recordInitialTrainingAnswer(
    item: UserItemLocal,
    session: PracticeSessionType | null,
    expectedSession: PracticeSessionType | null = session,
  ): Promise<void> {
    await db.transaction('rw', db.user_items, db.practice_sessions, async () => {
      assertValidInitialTrainingSession(expectedSession, item);
      // The availability observer can remove a stale-looking row while this page is open.
      // The session held by the active deck is the authoritative continuation state.
      const activeSession = await this.getActive(item.user_id);
      assertActiveInitialTrainingSession(activeSession);

      const updatedItemCount = await updateStoredPracticeItem(item);
      if (updatedItemCount !== 1) {
        throw new Error('The trained item no longer exists locally.');
      }
      if (session) {
        await db.practice_sessions.put(session);
      } else {
        await db.practice_sessions.delete(item.user_id);
      }
    });
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db.practice_sessions.delete(userId);
  }
}

function updateStoredPracticeItem(item: UserItemLocal): Promise<number> {
  return db.user_items.update([item.user_id, item.item_id], {
    progress_cz_to_en: item.progress_cz_to_en,
    started_at: item.started_at,
    updated_at: item.updated_at,
    next_at_cz_to_en: item.next_at_cz_to_en,
    mastered_at_cz_to_en: item.mastered_at_cz_to_en,
    progress_en_to_cz: item.progress_en_to_cz,
    next_at_en_to_cz: item.next_at_en_to_cz,
    mastered_at_en_to_cz: item.mastered_at_en_to_cz,
  });
}
