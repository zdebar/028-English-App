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
   * Synchronizes user score data between the local IndexedDB and Supabase.
   *
   * @param userId The user ID.
   * @returns The number of user score records synced.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreSinceLastSync(userId: string): Promise<number> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();

    // Step 1 - Push local updates to Supabase
    const localUpdatesCount = await UserScore.pushUserScores(userId, lastSyncedAt, newSyncedAt);
    infoHandler(
      `Completed ${localUpdatesCount} user scores push to Supabase for userId: ${userId}`,
    );

    // Step 2 - Pull updates from Supabase
    const serverUpdatesCount = await UserScore.pullUserScores(userId, lastSyncedAt, newSyncedAt);
    infoHandler(
      `Completed ${serverUpdatesCount} user scores pull from Supabase for userId: ${userId}`,
    );

    return serverUpdatesCount;
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase.
   *
   * @param userId The user ID.
   * @returns The number of user score records synced.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreAll(userId: string): Promise<number> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();

    // Step 1 - Push local updates to Supabase
    const localUpdatesCount = await UserScore.pushUserScores(userId, lastSyncedAt, newSyncedAt);
    infoHandler(
      `Completed ${localUpdatesCount} user scores push to Supabase for userId: ${userId}`,
    );

    // Step 2 - Pull updates from Supabase
    const serverUpdatesCount = await UserScore.pullUserScores(
      userId,
      config.database.epochStartDate,
      newSyncedAt,
    );
    infoHandler(
      `Completed ${serverUpdatesCount} user scores pull from Supabase for userId: ${userId}`,
    );

    return serverUpdatesCount;
  }

  /**
   * Retrieves user score updates that have been updated since the last sync.
   *
   * @param userId - The unique identifier of the user
   * @param lastSyncedAt - The timestamp of the last synchronization (ISO string format)
   * @param newSyncedAt - The timestamp of the current synchronization (ISO string format)
   * @returns A promise that resolves to an array of user score records updated after lastSyncedAt
   * @throws Error if database query fails
   * @private
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

    if (localScores.length === 0) return 0;

    const { error: errorInsert } = await supabaseInstance.rpc('upsert_user_scores', {
      scores: localScores,
    });

    if (errorInsert) {
      throw new SupabaseError(`User score synchronization failed.`, errorInsert, { localScores });
    }

    return localScores.length;
  }

  /**
   * Fetches updated user scores from Supabase using the fetch_user_scores RPC.
   *
   * @param userId - The unique identifier of the user
   * @param lastSyncedAt - The timestamp of the last synchronization (ISO string format). Defaults to epoch start date if not provided.
   * @param newSyncedAt - The timestamp of the current synchronization (ISO string format)
   * @returns Promise resolving to an array of updated user scores
   * @throws SupabaseError if the fetch operation fails
   */
  private static async pullUserScores(
    userId: string,
    lastSyncedAt: string = config.database.epochStartDate,
    newSyncedAt: string,
  ): Promise<number> {
    const { data: updatedScores, error: errorFetch } = await supabaseInstance.rpc(
      'fetch_user_scores',
      {
        user_id_input: userId,
        last_synced_at: lastSyncedAt,
        new_synced_at: newSyncedAt,
      },
    );

    if (errorFetch) {
      throw new SupabaseError(`Error fetching User Scores from Supabase.`, errorFetch, {
        userId,
        lastSyncedAt,
        newSyncedAt,
      });
    }

    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      if (updatedScores && updatedScores.length > 0) {
        await db.user_scores.bulkPut(updatedScores);
      }
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
    });

    return updatedScores?.length ?? 0;
  }
}
