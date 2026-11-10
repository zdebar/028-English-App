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
  completed_at!: string | null;
  updated_at!: string;

  /** Adds the user's first start record for a lesson. */
  private static async recordStart(
    userId: string,
    lessonId: number,
    startedAt: string,
  ): Promise<UserLessonType> {
    const row = {
      user_id: userId,
      lesson_id: lessonId,
      started_at: startedAt,
      completed_at: null,
      updated_at: startedAt,
    };
    await db.user_lessons.add(row);
    return row;
  }

  /** Returns lesson start records for a user. */
  static getByUserId(userId: string): Promise<UserLessonType[]> {
    return db.user_lessons.where('user_id').equals(userId).toArray();
  }

  /**
   * Records one lesson start when the lesson exists and all supplied items are eligible.
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
    const result = await db.transaction(
      'rw',
      db.user_lessons,
      db.user_items,
      db.lessons,
      async () => {
        const lesson = await db.lessons.get(lessonId);
        if (!lesson || lesson.deleted_at) return { started: false, row: null };

        const existingStart = await getCanonicalLessonStart(userId, lessonId);
        if (existingStart) {
          return { started: existingStart.completed_at == null, row: null };
        }

        const items = await db.user_items
          .where('[user_id+item_id]')
          .anyOf(itemIds.map((itemId) => [userId, itemId]))
          .toArray();
        if (
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

        const row = await this.recordStart(userId, lessonId, startedAt);
        return { started: true, row };
      },
    );
    if (result.row) {
      publishDataChanges(userId, { user_lessons: { upserted: [result.row] } });
    }
    return result.started;
  }

  /** Marks the earliest start row as complete without changing legacy duplicates. */
  static async completeLesson(
    userId: string,
    lessonId: number,
    completedAt: string = new Date().toISOString(),
  ): Promise<void> {
    const updatedRow = await db.transaction('rw', db.user_lessons, async () => {
      const canonical = await getCanonicalLessonStart(userId, lessonId);
      if (!canonical) throw new Error('Cannot complete a lesson that has not been started.');
      if (canonical.completed_at != null) return null;

      const row: UserLessonType = {
        ...canonical,
        completed_at: completedAt,
        updated_at: completedAt,
      };
      const updatedCount = await db.user_lessons.update(
        [canonical.user_id, canonical.lesson_id, canonical.started_at],
        { completed_at: row.completed_at, updated_at: row.updated_at },
      );
      if (updatedCount !== 1) throw new Error('The lesson start record no longer exists locally.');
      return row;
    });
    if (updatedRow) {
      publishDataChanges(userId, { user_lessons: { upserted: [updatedRow] } });
    }
  }

  /**
   * Synchronizes lesson starts and completion changes by their update timestamps.
   * @returns Remote lesson-row count and committed local changes.
   */
  static async syncFromRemote(userId: string): Promise<AppDataSyncResult> {
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(TableName.UserLessons, userId);
    const [remoteResult, localSnapshot] = await Promise.all([
      supabaseInstance
        .from('user_lessons')
        .select('user_id, lesson_id, started_at, completed_at, updated_at')
        .eq('user_id', userId)
        .gt('updated_at', lastSyncedAt)
        .lte('updated_at', newSyncedAt)
        .order('updated_at')
        .order('started_at'),
      db.user_lessons.where('user_id').equals(userId).toArray(),
    ]);

    if (remoteResult.error) {
      throw new SupabaseError('Failed to fetch user lesson history from Supabase', remoteResult.error);
    }

    const remoteRows = ((remoteResult.data ?? []) as UserLessonType[]).map(normalizeUserLesson);
    const remoteByKey = new Map(remoteRows.map((row) => [getUserLessonKey(row), row]));
    const localRowsToPush = localSnapshot
      .map(normalizeUserLesson)
      .filter((row) => isWithinSyncWindow(row.updated_at, lastSyncedAt, newSyncedAt))
      .filter((row) => shouldPushLocalLesson(row, remoteByKey.get(getUserLessonKey(row))));
    if (localRowsToPush.length > 0) {
      const { error } = await supabaseInstance.from('user_lessons').upsert(localRowsToPush, {
        onConflict: 'user_id,lesson_id,started_at',
      });
      if (error) throw new SupabaseError('Failed to sync user lesson history to Supabase', error);
    }

    let hasUnpushedConcurrentRows = false;
    let committedRemoteRows: NormalizedUserLesson[] = [];
    await db.transaction('rw', db.user_lessons, db.metadata, async () => {
      const currentLocalRows = await db.user_lessons.where('user_id').equals(userId).toArray();
      const snapshotByKey = new Map(
        localSnapshot.map((row) => [getUserLessonKey(row), normalizeUserLesson(row)]),
      );
      hasUnpushedConcurrentRows = currentLocalRows.some((row) => {
        const snapshot = snapshotByKey.get(getUserLessonKey(row));
        return snapshot == null || !hasSameLessonState(snapshot, normalizeUserLesson(row));
      });
      const localByKey = new Map(
        currentLocalRows.map((row) => [getUserLessonKey(row), normalizeUserLesson(row)]),
      );
      committedRemoteRows = remoteRows.map((remoteRow) => {
        const localRow = localByKey.get(getUserLessonKey(remoteRow));
        return localRow ? mergeLessonRows(localRow, remoteRow) : remoteRow;
      });
      if (committedRemoteRows.length > 0) await db.user_lessons.bulkPut(committedRemoteRows);
      if (!hasUnpushedConcurrentRows) {
        await SyncMetadata.markAsSynced(TableName.UserLessons, newSyncedAt, userId);
      }
    });
    return {
      count: remoteRows.length,
      changes: { user_lessons: { upserted: committedRemoteRows } },
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

async function getCanonicalLessonStart(
  userId: string,
  lessonId: number,
): Promise<UserLessonType | undefined> {
  const rows = await db.user_lessons
    .where('[user_id+lesson_id+started_at]')
    .between(
      [userId, lessonId, Dexie.minKey],
      [userId, lessonId, Dexie.maxKey],
    )
    .toArray();
  rows.sort((left, right) => compareStartTimes(left.started_at, right.started_at));
  return rows[0];
}

function normalizeUserLesson(row: UserLessonType): NormalizedUserLesson {
  return {
    ...row,
    started_at: new Date(row.started_at).toISOString(),
    completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    updated_at: new Date(row.updated_at ?? row.started_at).toISOString(),
  };
}

function shouldPushLocalLesson(
  localRow: NormalizedUserLesson,
  remoteRow: NormalizedUserLesson | undefined,
): boolean {
  if (!remoteRow) return true;
  if (remoteRow.completed_at != null) return false;
  return localRow.completed_at != null;
}

function mergeLessonRows(
  localRow: NormalizedUserLesson,
  remoteRow: NormalizedUserLesson,
): NormalizedUserLesson {
  const completionDates = [localRow.completed_at, remoteRow.completed_at]
    .filter((date): date is string => date != null)
    .sort(compareStartTimes);
  return {
    ...localRow,
    completed_at: completionDates[0] ?? null,
    updated_at: localRow.updated_at > remoteRow.updated_at ? localRow.updated_at : remoteRow.updated_at,
  };
}

function hasSameLessonState(left: NormalizedUserLesson, right: NormalizedUserLesson): boolean {
  return left.completed_at === right.completed_at && left.updated_at === right.updated_at;
}

function isWithinSyncWindow(updatedAt: string, lastSyncedAt: string, newSyncedAt: string): boolean {
  return updatedAt > lastSyncedAt && updatedAt <= newSyncedAt;
}

function compareStartTimes(left: string, right: string): number {
  return Date.parse(left) - Date.parse(right) || left.localeCompare(right);
}

type NormalizedUserLesson = UserLessonType & Readonly<{
  completed_at: string | null;
  updated_at: string;
}>;
