import { supabaseInstance } from '@/config/supabase.config';
import { generateUserScoreId, getTodayShortDate } from '@/database/database.utils';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { errorHandler } from '@/features/error-handler/error-handler';
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
   * @throws Error
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
   * Synchronizes user score data between the local IndexedDB and Supabase.
   *
   * @static
   * @param userId The user ID.
   * @returns The number of user score records synced.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreData(userId: string): Promise<number> {
    // Step 1: Get the last synced date for the user_scores table
    const lastSyncedAt = await Metadata.getSyncedDate(TableName.UserScores, userId);

    // Step 2: Get the current time
    const newSyncTime = new Date().toISOString();

    // Step 3: Gather local changes since the last sync
    const localScores = await db.user_scores
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, Dexie.maxKey], true, true)
      .toArray();

    // Step 3: Send local scores to Supabase for updates
    const { error: errorInsert } = await supabaseInstance.rpc('upsert_user_scores', {
      scores: localScores,
    });

    if (errorInsert) {
      throw new Error(`User score synchronization failed.`, errorInsert);
    }

    // Step 4: Fetch updated records from supabase
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

    // Step 5: Rewrite local database with updated scores, update metadata
    if (!updatedScores || updatedScores.length === 0) {
      return 0;
    }

    try {
      const scoresWithId = updatedScores.map((score: UserScore) => ({
        ...score,
        id: generateUserScoreId(score.user_id, score.date),
      }));

      await db.transaction('rw', db.user_scores, db.metadata, async () => {
        await db.user_scores.bulkPut(scoresWithId);
        await Metadata.markAsSynced(TableName.UserScores, newSyncTime, userId);
      });
    } catch (error) {
      errorHandler(error, `Failed to update user scores for userId: ${userId}`);
      throw new Error('No updated user scores received from Supabase.');
    }
    return updatedScores.length;
  }
}
