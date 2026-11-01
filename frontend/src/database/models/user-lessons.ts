import { supabaseInstance } from '@/config/supabase.config';
import SyncMetadata from '@/database/models/metadata';
import { db } from '@/database/models/db';
import { getSyncTimestamps } from '@/database/sync/sync-helpers';
import type { UserLessonType } from '@/types/generic.types';
import { SupabaseError } from '@/types/error.types';
import { TableName } from '@/types/table.types';
import { Entity } from 'dexie';
import type AppDB from './app-db';
import config from '@/config/config';

export default class UserLesson extends Entity<AppDB> implements UserLessonType {
  user_id!: string;
  lesson_id!: number;
  started_at!: string;

  /** Adds a lesson start to the local history. */
  private static async recordStart(userId: string, lessonId: number, startedAt: string): Promise<void> {
    await db.user_lessons.put({ user_id: userId, lesson_id: lessonId, started_at: startedAt });
  }

  /** Returns lesson start records for a user. */
  static getByUserId(userId: string): Promise<UserLessonType[]> {
    return db.user_lessons.where('user_id').equals(userId).toArray();
  }

  /**
   * Records a lesson start once per local day when all supplied items are eligible.
   * @returns True when eligible or already started today; otherwise false.
   */
  static startIfEligible(
    userId: string,
    lessonId: number,
    itemIds: number[],
    startedAt: string = new Date().toISOString(),
  ): Promise<boolean> {
    return db.transaction('rw', db.user_lessons, db.user_items, async () => {
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
        return false;
      }

      const startedToday = await this.hasStartedToday(userId, lessonId, new Date(startedAt));
      if (startedToday) return true;

      await this.recordStart(userId, lessonId, startedAt);
      return true;
    });
  }

  /** Checks whether the user has a lesson start in the local calendar day of `now`. */
  static async hasStartedToday(userId: string, lessonId: number, now: Date = new Date()): Promise<boolean> {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const row = await db.user_lessons
      .where('[user_id+lesson_id+started_at]')
      .between([userId, lessonId, start], [userId, lessonId, end], true, false)
      .first();
    return row !== undefined;
  }

  /**
   * Synchronizes lesson starts newer than the stored date checkpoint.
   * @returns Number of remote lesson-start rows fetched.
   */
  static async syncFromRemote(userId: string): Promise<number> {
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
    return remoteRows.length;
  }

  /** Removes all local lesson-start records for a user. */
  static async removeByUserId(userId: string): Promise<void> {
    await db.user_lessons.where('user_id').equals(userId).delete();
  }
}

function getUserLessonKey(row: UserLessonType): string {
  return `${row.user_id}:${row.lesson_id}:${row.started_at}`;
}

function isWithinSyncWindow(startedAt: string, lastSyncedAt: string, newSyncedAt: string): boolean {
  return startedAt > lastSyncedAt && startedAt <= newSyncedAt;
}
