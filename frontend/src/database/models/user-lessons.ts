import { supabaseInstance } from '@/config/supabase.config';
import { db } from '@/database/models/db';
import type { UserLessonType } from '@/types/generic.types';
import { SupabaseError } from '@/types/error.types';
import { Entity } from 'dexie';
import type AppDB from './app-db';
import UserSettings from './user-settings';
import config from '@/config/config';

export default class UserLesson extends Entity<AppDB> implements UserLessonType {
  user_id!: string;
  lesson_id!: number;
  started_at!: string;

  static async recordStart(userId: string, lessonId: number, startedAt: string): Promise<void> {
    await db.user_lessons.put({ user_id: userId, lesson_id: lessonId, started_at: startedAt });
  }

  /** Records a lesson's first daily start while enforcing the current daily limit. */
  static startIfAllowed(
    userId: string,
    lessonId: number,
    itemIds: number[],
    startedAt: string = new Date().toISOString(),
  ): Promise<boolean> {
    return db.transaction('rw', db.user_lessons, db.users, db.user_items, async () => {
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

      const settings = await UserSettings.getOrCreate(userId);
      const startedCount = await this.getStartedCountForToday(userId, new Date(startedAt));
      if (startedCount >= settings.max_new_lessons_per_day) return false;

      await this.recordStart(userId, lessonId, startedAt);
      return true;
    });
  }

  static async hasStartedToday(userId: string, lessonId: number, now: Date = new Date()): Promise<boolean> {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const row = await db.user_lessons
      .where('[user_id+lesson_id+started_at]')
      .between([userId, lessonId, start], [userId, lessonId, end], true, false)
      .first();
    return row !== undefined;
  }

  static async canStartToday(userId: string, lessonId: number, now: Date = new Date()): Promise<boolean> {
    const [startedToday, settings, startedCount] = await Promise.all([
      this.hasStartedToday(userId, lessonId, now),
      UserSettings.getOrCreate(userId),
      this.getStartedCountForToday(userId, now),
    ]);
    return startedToday || startedCount < settings.max_new_lessons_per_day;
  }

  static async getStartedCountForToday(userId: string, now: Date = new Date()): Promise<number> {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const rows = await db.user_lessons
      .where('[user_id+started_at]')
      .between([userId, start], [userId, end], true, false)
      .toArray();
    return new Set(rows.map((row) => row.lesson_id)).size;
  }

  static async syncFromRemote(userId: string, _doFullSync = false): Promise<number> {
    const [remoteResult, localRows] = await Promise.all([
      supabaseInstance
        .from('user_lessons')
        .select('user_id, lesson_id, started_at')
        .eq('user_id', userId)
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
    if (localRows.length > 0) {
      const { error } = await supabaseInstance.from('user_lessons').upsert(localRows, {
        onConflict: 'user_id,lesson_id,started_at',
        ignoreDuplicates: true,
      });
      if (error) throw new SupabaseError('Failed to sync user lesson history to Supabase', error);
    }

    await db.transaction('rw', db.user_lessons, async () => {
      const currentLocalRows = await db.user_lessons.where('user_id').equals(userId).toArray();
      const rowsByKey = new Map(
        [...remoteRows, ...localRows, ...currentLocalRows].map((row) => [getUserLessonKey(row), row]),
      );
      if (rowsByKey.size > 0) await db.user_lessons.bulkPut([...rowsByKey.values()]);
    });
    return remoteRows.length;
  }

  static async removeByUserId(userId: string): Promise<void> {
    await db.user_lessons.where('user_id').equals(userId).delete();
  }
}

function getUserLessonKey(row: UserLessonType): string {
  return `${row.user_id}:${row.lesson_id}:${row.started_at}`;
}
