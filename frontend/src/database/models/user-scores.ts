import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import { addUserScoreId, generateUserScoreId, getTodayShortDate } from '@/database/database.utils';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { SupabaseError } from '@/types/error.types';
import { TableName, type UserScoreLocal } from '@/types/local.types';
import { Entity } from 'dexie';
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
   * @param userId - The user ID. Must be a valid string.
   * @param addCount - The number to add to today's item count.
   * @returns True if the operation was successful, false otherwise.
   * @throws Error if database operation fails.
   */
  static async addItemCount(userId: string, addCount: number): Promise<boolean> {
    const today = getTodayShortDate();
    const key = generateUserScoreId(userId, today);
    const existingRecord = await db.user_scores.get(key);
    const newItemCount = (existingRecord?.item_count ?? 0) + addCount;

    const newRecord: UserScoreLocal = {
      id: existingRecord?.id || key,
      user_id: existingRecord?.user_id || userId,
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
   * @param userId The user ID.
   * @returns The number of user score records synced.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreSinceLastSync(userId: string): Promise<number> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();

    const localScores = await UserScore.getUserScore(userId, lastSyncedAt, newSyncedAt);
    await UserScore.upsertUserScores(localScores);

    const updatedScores = await UserScore.fetchUserScores(userId, lastSyncedAt, newSyncedAt);
    if (!updatedScores || updatedScores.length === 0) {
      return 0;
    }
    const scoresWithId = addUserScoreId(updatedScores);

    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      await db.user_scores.bulkPut(scoresWithId);
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
    });

    return updatedScores.length;
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase.
   *
   * @param userId The user ID.
   * @returns The number of user score records synced.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreAll(userId: string): Promise<number> {
    // Step 1 - Determine the last sync time and the new sync time
    const lastSyncedAt = config.database.epochStartDate;
    const newSyncedAt = new Date().toISOString();

    // Step 2 - Push local changes to Supabase
    const localScores = await UserScore.getUserScore(userId, lastSyncedAt, newSyncedAt);
    await UserScore.upsertUserScores(localScores);

    // Step 3 - Pull server changes from Supabase and update local IndexedDB
    const updatedScores = await UserScore.fetchUserScores(userId, lastSyncedAt, newSyncedAt);
    if (!updatedScores || updatedScores.length === 0) {
      return 0;
    }
    const scoresWithId = addUserScoreId(updatedScores);

    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      await db.user_scores.bulkPut(scoresWithId);
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
    });

    // Step 4 - Clean orphaned data
    const fetchedIds = new Set(scoresWithId.map((score) => score.id));
    const localIds = await db.user_scores.where('user_id').equals(userId).primaryKeys();
    const orphanedIds = localIds.filter((id) => !fetchedIds.has(id));
    if (orphanedIds.length > 0) {
      await db.user_scores.bulkDelete(orphanedIds);
    }

    return updatedScores.length;
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
  private static async getUserScore(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserScoreLocal[]> {
    return await db.user_scores
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();
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
  private static async fetchUserScores(
    userId: string,
    lastSyncedAt: string = config.database.epochStartDate,
    newSyncedAt: string,
  ): Promise<UserScoreLocal[]> {
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

    return updatedScores ?? [];
  }

  /**
   * Sends local user scores to Supabase using the upsert_user_scores RPC.
   *
   * @param localScores Array of UserScoreLocal to sync
   * @returns Promise that resolves to a boolean indicating the success of the upsert operation
   * @throws SupabaseError if the upsert operation fails
   * @private
   */
  private static async upsertUserScores(localScores: UserScoreLocal[]): Promise<boolean> {
    const { error: errorInsert } = await supabaseInstance.rpc('upsert_user_scores', {
      scores: localScores,
    });

    if (errorInsert) {
      throw new SupabaseError(`User score synchronization failed.`, errorInsert, { localScores });
    }

    return true;
  }
}
