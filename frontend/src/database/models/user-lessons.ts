import { supabaseInstance } from '@/config/supabase.config';
import SyncMetadata from '@/database/models/metadata';
import { db } from '@/database/models/db';
import { getSyncTimestamps } from '@/database/sync/sync-helpers';
import type { UserLessonType } from '@/types/generic.types';
import { SupabaseError } from '@/types/error.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import type AppDB from './app-db';
import config from '@/config/config';
import type { AppDataSyncResult } from '@/database/state/data-types';
import { publishDataChanges } from '@/database/state/data-store';

export default class UserLesson extends Entity<AppDB> implements UserLessonType {
  user_id!: string;
  lesson_id!: number;
  started_at!: string;

  /** Adds the user's first start record for a lesson. */
  private static async recordStart(userId: string, lessonId: number, startedAt: string): Promise<void> {
    await db.user_lessons.add({ user_id: userId, lesson_id: lessonId, started_at: startedAt });
  }

  /** Returns lesson start records for a user. */
  static getByUserId(userId: string): Promise<UserLessonType[]> {
    return db.user_lessons.where('user_id').equals(userId).toArray();
  }

  /**
   * Records a lesson start once per user when all supplied items are eligible.
   * @returns True when eligible or already recorded; otherwise false.
   */
  static startIfEligible(
    userId: string,
    lessonId: number,
    itemIds: number[],
    startedAt: string = new Date().toISOString(),
  ): Promise<boolean> {
    return this.startIfEligibleInternal(userId, lessonId, itemIds, startedAt);
  }

  /** Checks and persists a lesson start while publishing only after transaction commit. */
  private static async startIfEligibleInternal(
    userId: string,
    lessonId: number,
    itemIds: number[],
    startedAt: string,
  ): Promise<boolean> {
    const result = await db.transaction('rw', db.user_lessons, db.user_items, async () => {
      const items = await db.user_items
        .where('[user_id+item_id]')
        .anyOf(itemIds.map((itemId) => [userId, itemId]))
        .toArray();
      if (
        itemIds.length === 0 ||
        items.length !== itemIds.length ||
        items.some(
          (item) =>
            item.lesson_id !== lessonId ||
            item.started_at !== config.database.nullReplacementDate ||
            item.deleted_at !== config.database.nullReplacementDate ||
            !item.is_cz_to_en_enabled,
        )
      ) {
        return { started: false, row: null };
      }

      const existingStart = await db.user_lessons
        .where('[user_id+lesson_id+started_at]')
        .between(
          [userId, lessonId, Dexie.minKey],
          [userId, lessonId, Dexie.maxKey],
        )
        .first();
      if (existingStart) return { started: true, row: null };

      const row = { user_id: userId, lesson_id: lessonId, started_at: startedAt };
      await this.recordStart(userId, lessonId, startedAt);
      return { started: true, row };
    });
    if (result.row) {
      publishDataChanges(userId, { user_lessons: { upserted: [result.row] } });
    }
    return result.started;
  }

  /**
   * Synchronizes lesson starts newer than the stored date checkpoint.
   * @returns Remote lesson-start count and committed local changes.
   */
  static async syncFromRemote(userId: string): Promise<AppDataSyncResult> {
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(TableName.UserLessons, userId);
    const [remoteResult, localSnapshot] = await Promise.all([
      supabaseInstance
        .from('user_lessons')
        .select('user_id, lesson_id, started_at')
        .eq('user_id', userId)
        .gt('started_at', lastSyncedAt)
        .lte('started_at', newSyncedAt)
        .order('started_at'),
      db.user_lessons.where('user_id').equals(userId).toArray(),
    ]);

    if (remoteResult.error) {
      throw new SupabaseError('Failed to fetch user lesson history from Supabase', remoteResult.error);
    }

    const remoteRows = ((remoteResult.data ?? []) as UserLessonType[]).map((row) => ({
      ...row,
      started_at: new Date(row.started_at).toISOString(),
    }));
    const localRowsToPush = localSnapshot.filter((row) =>
      isWithinSyncWindow(row.started_at, lastSyncedAt, newSyncedAt),
    );
    if (localRowsToPush.length > 0) {
      const { error } = await supabaseInstance.from('user_lessons').upsert(localRowsToPush, {
        onConflict: 'user_id,lesson_id,started_at',
        ignoreDuplicates: true,
      });
      if (error) throw new SupabaseError('Failed to sync user lesson history to Supabase', error);
    }

    let hasUnpushedConcurrentRows = false;
    await db.transaction('rw', db.user_lessons, db.metadata, async () => {
      const currentLocalRows = await db.user_lessons.where('user_id').equals(userId).toArray();
      const initialKeys = new Set(localSnapshot.map(getUserLessonKey));
      hasUnpushedConcurrentRows = currentLocalRows.some(
        (row) =>
          isWithinSyncWindow(row.started_at, lastSyncedAt, newSyncedAt) &&
          !initialKeys.has(getUserLessonKey(row)),
      );
      if (remoteRows.length > 0) await db.user_lessons.bulkPut(remoteRows);
      if (!hasUnpushedConcurrentRows) {
        await SyncMetadata.markAsSynced(TableName.UserLessons, newSyncedAt, userId);
      }
    });
    return {
      count: remoteRows.length,
      changes: { user_lessons: { upserted: remoteRows } },
    };
  }

  /** Removes all local lesson-start records for a user. */
  static async removeByUserId(userId: string): Promise<void> {
    const rows = await db.transaction('rw', db.user_lessons, async () => {
      const existing = await db.user_lessons.where('user_id').equals(userId).toArray();
      await db.user_lessons.bulkDelete(existing.map((row) => [row.user_id, row.lesson_id, row.started_at]));
      return existing;
    });
    if (rows.length > 0) {
      publishDataChanges(userId, {
        user_lessons: { deleted: rows.map(getUserLessonKey) },
      });
    }
  }
}

function getUserLessonKey(row: UserLessonType): string {
  return `${row.user_id}:${row.lesson_id}:${row.started_at}`;
}

function isWithinSyncWindow(startedAt: string, lastSyncedAt: string, newSyncedAt: string): boolean {
  return startedAt > lastSyncedAt && startedAt <= newSyncedAt;
}
