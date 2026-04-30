import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { getTodayShortDate } from '@/database/utils/database.utils';
import { getSyncTimestamps, splitDeleted } from '../utils/data-sync.utils';
import { infoHandler } from '@/features/logging/info-handler';
import { SupabaseError } from '@/types/error.types';
import { type UserScoreType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import {
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveInteger,
  assertShortDateString,
} from '@/utils/assertions.utils';
import { Entity } from 'dexie';
import Metadata from './metadata';
/**
 * Represents a user score entity in the application database.
 *
 * @method addItemCount - Increases the item count for today's date by the specified amount.
 * @method getOrCreateTodayScore - Fetches the user score record for today's date. Creates a new record with item_count set to 0 if no record exists.
 * @method deleteByUserId - Clears all user score records for a given user.
 * @method syncFromRemote - Synchronizes user scores between local database and Supabase.
 */
export default class UserScore extends Entity<AppDB> implements UserScoreType {
  user_id!: string;
  date!: string;
  item_count!: number;
  updated_at!: string;
  deleted_at!: string | null;

  /**
   * Increases the item count for today's date by the specified amount.
   * @param userId - The user ID. Must be a valid string.
   * @param count - The number to add to today's item count. Must be a non-negative integer.
   * @param dateTime - The ISO string representing the date and time of the update. If not provided, defaults to the current date and time.
   */
  static async addItemCount(
    userId: string,
    count: number,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    assertPositiveInteger(count, 'addItemCount');

    const date = new Date(dateTime).toLocaleDateString('en-CA');
    const existingRecord = await db.user_scores.get([userId, date]);
    const newItemCount = (existingRecord?.item_count ?? 0) + count;
    await db.user_scores.put(this.createRecord(userId, date, newItemCount));
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
   * Clears all user score records for a given user.
   * Use only for deletion of user account, when user scores on remote are deleted automatically.
   * @param userId - The ID of the user whose scores should be cleared
   */
  static async deleteByUserId(userId: string): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    await db.user_scores.where('user_id').equals(userId).delete();
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
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.UserScores,
      userId,
    );

    // Step 2: Push local changes and pull updates in a single RPC call
    const localScores = await this.getUserScoresForSync(userId, lastSyncedAt, newSyncedAt);
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

    infoHandler(
      `Completed ${updatedScores.length} user scores pull from remote for userId: ${userId}`,
    );
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
  ): Promise<UserScoreType[]> {
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
   * Pushes local user scores to the remote database.
   * @param scores - The local user scores to be synced.
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

    if (scores.length > 0) {
      infoHandler(`Completed ${scores.length} user scores push to Supabase for userId: ${userId}`);
    }

    return updatedScores ?? [];
  }
}
