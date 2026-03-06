import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { getTodayShortDate } from '@/database/utils/database.utils';
import { getSyncTimestamps } from '../utils/data-sync.utils';
import { infoHandler } from '@/features/logging/info-handler';
import { SupabaseError } from '@/types/error.types';
import { TableName, type UserScoreLocal } from '@/types/local.types';
import {
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveInteger,
  assertShortDateString,
} from '@/utils/assertions.utils';
import { Entity } from 'dexie';
import { splitDeleted } from '../utils/data-sync.utils';
import Metadata from './metadata';
import { triggerDailyCountUpdatedEvent } from '@/features/user-stats/dashboard.utils';

/**
 * Represents a user score entity in the application database.
 *
 * @method addItemCount - Increases the item count for today's date by the specified amount.
 * @method getUserScoreForToday - Fetches the user score record for today's date.
 * @method syncUserScores - Synchronizes user scores between local database and Supabase.
 * @method deleteAllScores - Deletes all user score records for a given user.
 */
export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  user_id!: string;
  date!: string;
  item_count!: number;
  updated_at!: string;
  deleted_at!: string | null;

  /**
   * Increases the item count for today's date by the specified amount.
   * @param userId - The user ID. Must be a valid string.
   * @param count - The number to add to today's item count. Must be a non-negative integer.
   */
  static async addItemCount(userId: string, count: number): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    assertPositiveInteger(count, 'addItemCount');

    const today = getTodayShortDate();
    const existingRecord = await db.user_scores.get([userId, today]);
    const newItemCount = (existingRecord?.item_count ?? 0) + count;
    await db.user_scores.put(this.createRecord(userId, today, newItemCount));
    triggerDailyCountUpdatedEvent(userId);
  }

  /**
   * Fetches the user score record for today's date. If no record exists, returns a new record with item_count set to 0.
   * @param userId The user ID.
   */
  static async getOrCreateTodayScore(userId: string): Promise<number> {
    assertNonEmptyString(userId, 'userId');
    const today = getTodayShortDate();
    return (await db.user_scores.get([userId, today]))?.item_count ?? 0;
  }

  /**
   * Synchronizes user scores between local database and Supabase.
   *
   * Performs a two-way sync by first pushing local changes to Supabase,
   * then pulling updated scores back to the local database.
   *
   * Optionally performs a full sync by clearing all local scores and resyncing from
   * the epoch start date.
   *
   * @param userId - The unique identifier of the user whose scores to sync
   * @param doFullSync - If true, performs a full sync by deleting all local scores
   *                     and pulling from the epoch start date. Defaults to false.
   */
  static async syncFromRemote(userId: string, doFullSync: boolean = false): Promise<void> {
    assertNonEmptyString(userId, 'userId');

    // Step 1: Get the last synced timestamp for user scores
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(doFullSync, userId);

    // Step 2: Push local changes to Supabase
    const localScores = await this.getUserScoresForSync(userId, lastSyncedAt, newSyncedAt);
    await this.postToRemote(localScores);

    // Step 3: Pull scores from Supabase
    const updatedScores = await this.fetchFromRemote(userId, lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedScores);

    // Step 4: Update local database with fetched scores and update sync metadata
    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      if (doFullSync) {
        await this.deleteAllScores(userId);
      } else if (toDelete.length > 0) {
        await db.user_scores.bulkDelete(toDelete.map((item) => [item.user_id, item.date]));
      }
      if (toUpsert.length > 0) {
        await db.user_scores.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
      triggerDailyCountUpdatedEvent(userId);
    });
  }

  /**
   * Clears all user score records for a given user.
   * Use only for deletion of user account, when user scores on remote are deleted automatically.
   * @param userId - The ID of the user whose scores should be cleared
   */
  static async deleteAllScores(userId: string): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    await db.user_scores.where('user_id').equals(userId).delete();
  }

  /**
   * Gets user scores from IndexedDB for a specific user that were updated in between the last synced timestamp and the new synced timestamp.
   * @param userId - The ID of the user whose scores should be fetched
   * @param lastSyncedAt - The timestamp of the last sync (inclusive)
   * @param newSyncedAt - The timestamp of the new sync (exclusive)
   */
  private static async getUserScoresForSync(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserScoreLocal[]> {
    const localScores = await db.user_scores
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    if (localScores.length === 0) {
      infoHandler(`No user scores to push for userId: ${userId}`);
      return [];
    }

    return localScores;
  }

  /**
   * Creates a user score record with the provided information.
   * @param userId - The unique identifier of the user
   * @param date - The date associated with the score record
   * @param count - The number of items counted in this score. Should be a non-negative integer.
   */
  private static createRecord(userId: string, date: string, count: number): UserScoreLocal {
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
   * Pushes local user scores to the remote database.
   * @param scores - The local user scores to be synced.
   */
  private static async postToRemote(scores: UserScoreLocal[]): Promise<void> {
    if (!scores || scores.length === 0) return;

    const { error: errorInsert } = await supabaseInstance.rpc('upsert_user_scores', {
      p_user_scores: scores,
    });

    if (errorInsert) {
      throw new SupabaseError(`User score synchronization failed.`, errorInsert, {
        localScores: scores,
      });
    }

    infoHandler(
      `Completed ${scores.length} user scores push to Supabase for userId: ${scores[0].user_id}`,
    );
  }

  /**
   * Fetches updated user scores from Supabase for a specific user since the last sync.
   * @param userId - The ID of the user whose scores should be fetched
   * @param lastSyncedAt - The timestamp of the last sync (defaults to epoch start date)
   */
  private static async fetchFromRemote(
    userId: string,
    lastSyncedAt: string = config.database.epochStartDate,
  ): Promise<UserScoreLocal[]> {
    const { data: updatedScores, error: errorFetch } = await supabaseInstance
      .from('user_scores')
      .select('user_id, date, item_count, updated_at, deleted_at')
      .eq('user_id', userId)
      .gt('updated_at', lastSyncedAt);

    if (errorFetch) {
      throw new SupabaseError(`Error fetching User Scores from Supabase.`, errorFetch, {
        userId,
        lastSyncedAt,
      });
    }

    return updatedScores ?? [];
  }
}
