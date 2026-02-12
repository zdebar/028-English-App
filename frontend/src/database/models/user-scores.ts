import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import { getTodayShortDate } from '@/database/database.utils';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { SupabaseError } from '@/types/error.types';
import { TableName, type UserScoreLocal } from '@/types/local.types';
import { Entity } from 'dexie';
import Metadata from './metadata';
import { infoHandler } from '@/features/logging/info-handler';
import { validateNonNegativeInteger } from '@/utils/validation.utils';

/**
 * Represents a user score entity in the application database.
 *
 * @method addItemCount - Increases the item count for today's date by the specified amount.
 * @method getUserScoreForToday - Fetches the user score record for today's date.
 * @method syncUserScoreSinceLastSync - Synchronizes user score data between the local IndexedDB and Supabase since the last sync.
 * @method syncUserScoreAll - Synchronizes all user score data between the local IndexedDB and Supabase.
 */
export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  user_id!: string;
  date!: string;
  item_count!: number;
  updated_at!: string;

  /**
   * Increases the item count for today's date by the specified amount.
   *
   * @param userId - The user ID. Must be a valid string.
   * @param addCount - The number to add to today's item count.
   * @returns True if the operation was successful, false otherwise.
   * @throws Error if database operation fails.
   */
  static async addItemCount(userId: string, addCount: number): Promise<boolean> {
    validateNonNegativeInteger(addCount, 'addItemCount');

    const today = getTodayShortDate();
    const existingRecord = await db.user_scores.get([userId, today]);
    const newItemCount = (existingRecord?.item_count ?? 0) + addCount;

    const newRecord: UserScoreLocal = {
      user_id: userId,
      date: today,
      item_count: newItemCount,
      updated_at: new Date().toISOString(),
    };

    await db.user_scores.put(newRecord);
    return true;
  }

  /**
   * Fetches the user score record for today's date. If no record exists, returns a new record with item_count set to 0.
   *
   * @param userId The user ID.
   * @returns The user score record for today, or a new record with item_count 0 if none exists.
   * @throws Error if database operation fails.
   */
  static async getUserScoreForToday(userId: string): Promise<UserScoreLocal> {
    const today = getTodayShortDate();

    return (
      (await db.user_scores.get([userId, today])) ?? {
        user_id: userId,
        date: today,
        item_count: 0,
        updated_at: new Date().toISOString(),
      }
    );
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase. Pulls only changes since the last sync.
   *
   * @param userId The user ID.
   * @returns Promise<void>.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreSinceLastSync(userId: string): Promise<void> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();
    await UserScore.pushUserScores(userId, lastSyncedAt, newSyncedAt);
    await UserScore.pullUserScores(userId, lastSyncedAt, newSyncedAt);
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase. Pulls all new data from the backend.
   *
   * @param userId The user ID.
   * @returns Promise<void>.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreAll(userId: string): Promise<void> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();
    await UserScore.pushUserScores(userId, lastSyncedAt, newSyncedAt);
    await db.user_scores.where('user_id').equals(userId).delete();
    await UserScore.pullUserScores(userId, config.database.epochStartDate, newSyncedAt);
  }

  /**
   * Deletes all user score records for a given user.
   * @param userId - The ID of the user whose scores should be deleted
   * @returns A promise that resolves to the number of records deleted
   */
  static async deleteAllUserScores(userId: string): Promise<number> {
    return await db.user_scores.where('user_id').equals(userId).delete();
  }

  /**
   * Pushes local user scores to the remote database that were updated within a specified time range.
   *
   * @param userId - The unique identifier of the user whose scores should be synced.
   * @param lastSyncedAt - The timestamp (inclusive) marking the start of the time range for scores to sync.
   * @param newSyncedAt - The timestamp (exclusive) marking the end of the time range for scores to sync.
   * @returns A promise that resolves to the number of scores successfully pushed to the remote database.
   *          Returns 0 if no scores were found in the specified time range.
   * @throws {SupabaseError} If the remote upsert operation fails, with details about the local scores that failed to sync.
   */
  private static async pushUserScores(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<number> {
    const localScores = await db.user_scores
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    if (localScores.length !== 0) {
      const { error: errorInsert } = await supabaseInstance.rpc('upsert_user_scores', {
        scores: localScores,
      });

      if (errorInsert) {
        throw new SupabaseError(`User score synchronization failed.`, errorInsert, { localScores });
      }
    }

    infoHandler(
      `Completed ${localScores.length} user scores push to Supabase for userId: ${userId}`,
    );

    return localScores.length;
  }

  /**
   * Fetches updated user scores from Supabase for a specific user since the last sync.
   * Stores the fetched scores in the local database and updates the sync metadata.
   *
   * @param userId - The ID of the user whose scores should be fetched
   * @param lastSyncedAt - The timestamp of the last sync (defaults to epoch start date)
   * @param newSyncedAt - The timestamp to mark as the new sync time
   * @returns A promise that resolves to the number of scores fetched and stored
   * @throws {SupabaseError} If the RPC call to fetch scores fails
   */
  private static async pullUserScores(
    userId: string,
    lastSyncedAt: string = config.database.epochStartDate,
    newSyncedAt: string = new Date().toISOString(),
  ): Promise<number> {
    const { data: updatedScores, error: errorFetch } = await supabaseInstance.rpc(
      'fetch_user_scores',
      {
        user_id_input: userId,
        last_synced_at: lastSyncedAt,
      },
    );

    if (errorFetch) {
      throw new SupabaseError(`Error fetching User Scores from Supabase.`, errorFetch, {
        userId,
        lastSyncedAt,
      });
    }

    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      if (updatedScores && updatedScores.length > 0) {
        await db.user_scores.bulkPut(updatedScores);
      }
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
    });

    const serverUpdatesCount = updatedScores?.length ?? 0;
    infoHandler(
      `Completed ${serverUpdatesCount} user scores pull from Supabase for userId: ${userId}`,
    );

    return serverUpdatesCount;
  }
}
