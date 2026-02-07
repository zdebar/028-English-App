import { supabaseInstance } from '@/config/supabase.config';
import { generateUserScoreId, getTodayShortDate, addUserScoreId } from '@/database/database.utils';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { TableName, type UserScoreLocal } from '@/types/local.types';
import Dexie, { Entity } from 'dexie';
import Metadata from './metadata';

/**
 * Represents a user score entity in the application database.
 *
 * @method addItemCount - Increases the item count for today's date by the specified amount.
 * @method getUserScoreForToday - Fetches the user score record for today's date.
 * @method syncUserScoreData - Synchronizes user score data between the local IndexedDB and Supabase.
 */
export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  id!: string;
  user_id!: string;
  date!: string;
  item_count!: number;
  updated_at!: string;

  /**
   * Increases the item count for today's date by the specified amount.
   *
   * @static
   * @param userId - The user ID. Must be a valid string.
   * @param addCount - The number to add to today's item count.
   * @returns True if the operation was successful, false otherwise.
   * @throws Error if database operation fails.
   */
  static async addItemCount(userId: string, addCount: number): Promise<boolean> {
    try {
      const today = getTodayShortDate();

      // Fetch the existing record for the userId and today's date
      const key = generateUserScoreId(userId, today);
      const existingRecord = await db.user_scores.get(key);

      // Calculate the new item count
      const newItemCount = (existingRecord?.item_count ?? 0) + addCount;

      // Create a new record or update the existing one
      const newRecord: UserScoreLocal = {
        id: existingRecord?.id || key,
        user_id: existingRecord?.user_id || userId,
        date: today,
        item_count: newItemCount,
        updated_at: new Date().toISOString(),
      };

      // Save the new record to IndexedDB
      await db.user_scores.put(newRecord);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches the user score record for today's date.
   *
   * @static
   * @param userId The user ID.
   * @returns The user score record for today, or a new record with item_count 0 if none exists.
   * @throws Error if database operation fails.
   */
  static async getUserScoreForToday(userId: string): Promise<UserScoreLocal> {
    const today = getTodayShortDate();
    const key = generateUserScoreId(userId, today);

    return (
      (await db.user_scores.get(key)) ?? {
        id: key,
        user_id: userId,
        date: today,
        item_count: 0,
        updated_at: new Date().toISOString(),
      }
    );
  }

  /**
   * Retrieves user score updates that have been modified since the last sync.
   *
   * @param userId - The unique identifier of the user
   * @param lastSyncedAt - The timestamp of the last synchronization (ISO string format)
   * @returns A promise that resolves to an array of user score records updated after lastSyncedAt
   * @private
   */
  private static async getUserScoreModifiedSince(
    userId: string,
    lastSyncedAt: string,
  ): Promise<UserScoreLocal[]> {
    return await db.user_scores
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, Dexie.maxKey], true, true)
      .toArray();
  }

  /**
   * Sends local user scores to Supabase using the upsert_user_scores RPC.
   * Throws an error if the synchronization fails.
   * @param localScores Array of UserScoreLocal to sync
   */
  private static async upsertUserScoresToSupabase(localScores: UserScoreLocal[]): Promise<void> {
    const { error: errorInsert } = await supabaseInstance.rpc('upsert_user_scores', {
      scores: localScores,
    });

    if (errorInsert) {
      throw new Error(`User score synchronization failed.`, errorInsert);
    }
  }

  /**
   * Fetches updated user scores from Supabase using the fetch_user_scores RPC.
   * Throws an error if the fetch fails.
   * @param userId - The unique identifier of the user
   * @param lastSyncedAt - The timestamp of the last synchronization (ISO string format)
   * @returns Promise resolving to an array of updated user scores
   */
  private static async fetchUpdatedScoresFromSupabase(
    userId: string,
    lastSyncedAt: string,
  ): Promise<UserScoreLocal[]> {
    const { data: updatedScores, error: errorFetch } = await supabaseInstance.rpc(
      'fetch_user_scores',
      {
        user_id_input: userId,
        last_synced_at: lastSyncedAt,
      },
    );

    if (errorFetch) {
      throw new Error(`Error fetching user scores from Supabase.`, errorFetch);
    }

    return updatedScores ?? [];
  }

  private static async updateUserScoresAndMetadata(
    scores: UserScoreLocal[],
    newSyncedAt: string,
    userId: string,
  ): Promise<void> {
    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      await db.user_scores.bulkPut(scores);
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
    });
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase.
   *
   * @static
   * @param userId The user ID.
   * @returns The number of user score records synced.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreData(userId: string): Promise<number> {
    // Step 1: Get the last synced date for the user_scores table
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();

    // Step 3: Gather local changes since the last sync
    const localScores = await UserScore.getUserScoreModifiedSince(userId, lastSyncedAt);

    // Step 3: Send local scores to Supabase for updates
    await UserScore.upsertUserScoresToSupabase(localScores);

    // Step 4: Fetch updated records from supabase
    const updatedScores = await UserScore.fetchUpdatedScoresFromSupabase(userId, lastSyncedAt);

    // Step 5: Rewrite local database with updated scores, update metadata
    if (!updatedScores || updatedScores.length === 0) {
      return 0;
    }

    const scoresWithId = addUserScoreId(updatedScores);
    try {
      await UserScore.updateUserScoresAndMetadata(scoresWithId, newSyncedAt, userId);
    } catch (error) {
      throw new Error('No updated user scores received from Supabase.');
    }

    return updatedScores.length;
  }
}
