import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { getTodayShortDate } from '@/database/utils/database.utils';
import { getSyncTimestamps, splitDeleted } from '../utils/sync-generic.utils';
import { SupabaseError } from '@/types/error.types';
import { type UserScoreType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import { assertNonNegativeInteger, assertShortDateString } from '@/utils/assertions.utils';
import { triggerDailyCountUpdatedEvent } from '@/utils/dashboard.utils';
import { Entity } from 'dexie';
import Metadata from './metadata';
import { reportInfo } from '@/features/logging/monitoring-handler';

/**
 * Local Dexie model and sync API for daily user score rows.
 *
 * Public API:
 * - `addItemCount` updates the score for a local day and emits `dailyCountUpdated`.
 * - `getOrCreateTodayScore` returns today's count, falling back to 0.
 * - `getByUserId` returns visible score history newest first.
 * - `syncFromRemote` pushes local score changes and applies remote changes.
 *
 * Account deletion uses `deleteByUserId`; remote cleanup is handled outside this local model.
 */
export default class UserScore extends Entity<AppDB> implements UserScoreType {
  user_id!: string;
  date!: string;
  item_count!: number;
  updated_at!: string;
  deleted_at!: string | null;

  /**
   * Adds practiced item count to the score row for dateTime's local day.
   *
   * @param userId User id for the score row.
   * @param count Non-negative count to add; zero is ignored.
   * @param dateTime ISO timestamp whose local YYYY-MM-DD date selects the score row. Defaults to now.
   * @throws Error when the resulting count is negative or non-integer.
   */
  static async addItemCount(
    userId: string,
    count: number,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<void> {
    if (count === 0) {
      return;
    }

    const date = new Date(dateTime).toLocaleDateString('en-CA');
    const existingRecord = await db.user_scores.get([userId, date]);
    const newItemCount = (existingRecord?.item_count ?? 0) + count;
    await db.user_scores.put(this.createRecord(userId, date, newItemCount));

    triggerDailyCountUpdatedEvent(userId, newItemCount);
  }

  /**
   * Reads today's practiced item count.
   *
   * @param userId User id for the score row.
   * @returns Today's item_count, or 0 when the row does not exist.
   */
  static async getOrCreateTodayScore(userId: string): Promise<number> {
    const today = getTodayShortDate();
    return (await db.user_scores.get([userId, today]))?.item_count ?? 0;
  }

  /**
   * Reads visible score history for a user.
   *
   * @param userId User id whose scores should be read.
   * @returns Non-deleted score rows ordered by date descending.
   */
  static async getByUserId(userId: string): Promise<UserScoreType[]> {
    const records = await db.user_scores.where('user_id').equals(userId).toArray();

    return records
      .filter((record) => record.deleted_at == null)
      .sort((left, right) => right.date.localeCompare(left.date));
  }

  /**
   * Deletes all local score rows for an account being removed.
   *
   * @param userId User id whose local score rows should be deleted.
   */
  static async deleteByUserId(userId: string): Promise<void> {
    await db.user_scores.where('user_id').equals(userId).delete();
  }

  /**
   * Pushes local score changes and applies remote score changes.
   *
   * @param userId User id whose score rows should sync.
   * @param doFullSync When true, local rows are cleared before applying remote rows from the epoch.
   * Defaults to false for incremental sync.
   * @returns Number of score rows returned by the remote sync RPC.
   * @throws SupabaseError when the sync RPC fails.
   * @throws Error when sync metadata userId validation fails.
   */
  static async syncFromRemote(userId: string, doFullSync: boolean = false): Promise<number> {
    // Step 1: Get the last synced timestamp for user scores
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.UserScores,
      userId,
    );

    // Step 2: Push local changes and pull updates in a single RPC call
    const localScores = await this.getUserScoresForSync(userId, lastSyncedAt, newSyncedAt);
    reportInfo(`Completed ${localScores.length} UserScores push to remote`);

    const updatedScores = await this.syncWithRemote(userId, localScores, lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedScores);

    // Step 4: Update local database with fetched scores and update sync metadata
    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      if (doFullSync) {
        await this.deleteByUserId(userId);
      } else if (toDelete.length > 0) {
        await db.user_scores.bulkDelete(toDelete.map((item) => [item.user_id, item.date]));
      }
      if (toUpsert.length > 0) {
        await db.user_scores.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
    });

    return updatedScores.length;
  }

  /**
   * Reads local score rows that changed inside a sync window.
   *
   * @param userId User id whose local score rows should be exported.
   * @param lastSyncedAt Inclusive lower updated_at bound.
   * @param newSyncedAt Exclusive upper updated_at bound.
   * @returns Score rows to push to the remote sync RPC.
   */
  private static async getUserScoresForSync(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserScoreType[]> {
    const localScores = await db.user_scores
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    return localScores;
  }

  /**
   * Creates a normalized score row.
   *
   * @param userId User id for the score row.
   * @param date Score date in YYYY-MM-DD format.
   * @param count Non-negative item count.
   * @throws Error when date or count is invalid.
   */
  private static createRecord(userId: string, date: string, count: number): UserScoreType {
    assertNonNegativeInteger(
      count,
      'count must be a non-negative integer to create a user score record.',
    );
    assertShortDateString(date);

    return {
      user_id: userId,
      date,
      item_count: count,
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
  }

  /**
   * Calls the Supabase score sync RPC.
   *
   * @param userId User id passed to the RPC.
   * @param scores Local score rows to upsert remotely before fetching remote changes.
   * @param lastSyncedAt Inclusive remote change lower bound; defaults to the epoch start date.
   * @returns Remote score rows changed since lastSyncedAt, or [] when none are returned.
   * @throws SupabaseError when the RPC fails.
   */
  private static async syncWithRemote(
    userId: string,
    scores: UserScoreType[],
    lastSyncedAt: string = config.database.epochStartDate,
  ): Promise<UserScoreType[]> {
    const { data: updatedScores, error: errorFetch } = await supabaseInstance.rpc(
      'upsert_fetch_user_scores',
      {
        p_user_id: userId,
        p_last_synced_at: lastSyncedAt,
        p_user_scores: scores,
      },
    );

    if (errorFetch) {
      throw new SupabaseError(`Error fetching User Scores from Supabase.`, errorFetch, {
        scoreCount: scores.length,
        lastSyncedAt,
      });
    }

    return updatedScores ?? [];
  }
}
