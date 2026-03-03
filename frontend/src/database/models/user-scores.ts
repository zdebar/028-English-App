import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import { getTodayShortDate } from '@/database/utils/database.utils';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { SupabaseError } from '@/types/error.types';
import { TableName, type UserScoreLocal } from '@/types/local.types';
import { Entity } from 'dexie';
import Metadata from './metadata';
import { infoHandler } from '@/features/logging/info-handler';
import { assertNonNegativeInteger } from '@/utils/assertions.utils';

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
   * @returns A promise that resolves when the operation is complete.
   * @throws Error if database operation fails.
   */
  static async addItemCount(userId: string, addCount: number): Promise<void> {
    if (!userId) throw new Error('User ID is required to add item count.');

    assertNonNegativeInteger(addCount, 'addItemCount');

    const today = getTodayShortDate();
    const existingRecord = await db.user_scores.get([userId, today]);
    const newItemCount = (existingRecord?.item_count ?? 0) + addCount;
    await db.user_scores.put(this.createRecord(userId, today, newItemCount));
  }

  /**
   * Fetches the user score record for today's date. If no record exists, returns a new record with item_count set to 0.
   *
   * @param userId The user ID.
   * @returns The user score record for today, or a new record with item_count 0 if none exists.
   * @throws Error if database operation fails.
   */
  static async getUserScoreForToday(userId: string): Promise<UserScoreLocal> {
    if (!userId) throw new Error('User ID is required to fetch user score for today.');

    const today = getTodayShortDate();
    return (await db.user_scores.get([userId, today])) ?? this.createRecord(userId, today, 0);
  }

  /**
   * Creates a user score record with the provided information.
   * @param userId - The unique identifier of the user
   * @param date - The date associated with the score record
   * @param itemCount - The number of items counted in this score. Should be a non-negative integer.
   * @returns A new UserScoreLocal object with the provided data and current timestamp
   */
  private static createRecord(userId: string, date: string, itemCount: number): UserScoreLocal {
    if (!userId) throw new Error('User ID is required to create a user score record.');
    if (!date) throw new Error('Date is required to create a user score record.');
    assertNonNegativeInteger(
      itemCount,
      'itemCount must be a non-negative integer to create a user score record.',
    );

    return {
      user_id: userId,
      date,
      item_count: itemCount,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase. Pulls only changes since the last sync.
   *
   * @param userId The user ID.
   * @returns Promise<void>.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreSinceLastSync(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to sync user scores since last sync.');

    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();

    await this.pushUserScores(userId, lastSyncedAt, newSyncedAt);
    const updatedScores = await this.pullUserScores(userId, lastSyncedAt, newSyncedAt);
    this.saveUserScoresToIndexedDB(userId, newSyncedAt, updatedScores, false);
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase. Pulls all new data from the backend.
   *
   * @param userId The user ID.
   * @returns Promise<void>.
   * @throws Error, if synchronization fails.
   */
  static async syncUserScoreAll(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to sync all user scores.');

    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();

    await this.pushUserScores(userId, lastSyncedAt, newSyncedAt);
    const updatedScores = await this.pullUserScores(
      userId,
      config.database.epochStartDate,
      newSyncedAt,
    );
    this.saveUserScoresToIndexedDB(userId, newSyncedAt, updatedScores, true);
  }

  /**
   * Deletes all user score records for a given user.
   * @param userId - The ID of the user whose scores should be deleted
   * @returns A promise that resolves when the records have been deleted
   */
  static async deleteAllUserScores(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to delete all user scores.');

    await db.user_scores.where('user_id').equals(userId).delete();
  }

  /**
   * Pushes local user scores to the remote database that were updated within a specified time range.
   *
   * @param userId - The unique identifier of the user whose scores should be synced.
   * @param lastSyncedAt - The timestamp (inclusive) marking the start of the time range for scores to sync.
   * @param newSyncedAt - The timestamp (exclusive) marking the end of the time range for scores to sync.
   * @returns A promise that resolves when the scores have been successfully pushed to the remote database.
   * @throws {SupabaseError} If the remote upsert operation fails, with details about the local scores that failed to sync.
   */
  private static async pushUserScores(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<void> {
    if (!userId) throw new Error('User ID is required to push user scores.');
    if (!lastSyncedAt) throw new Error('Last synced timestamp is required to push user scores.');
    if (!newSyncedAt) throw new Error('New synced timestamp is required to push user scores.');

    const localScores = await db.user_scores
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    if (localScores.length === 0) {
      infoHandler(`No user scores to push for userId: ${userId}`);
      return;
    }

    const { error: errorInsert } = await supabaseInstance.rpc('upsert_user_scores', {
      p_user_scores: localScores,
    });

    if (errorInsert) {
      throw new SupabaseError(`User score synchronization failed.`, errorInsert, { localScores });
    }

    infoHandler(
      `Completed ${localScores.length} user scores push to Supabase for userId: ${userId}`,
    );
  }

  /**
   * Fetches updated user scores from Supabase for a specific user since the last sync.
   * Stores the fetched scores in the local database and updates the sync metadata.
   *
   * @param userId - The ID of the user whose scores should be fetched
   * @param lastSyncedAt - The timestamp of the last sync (defaults to epoch start date)
   * @param newSyncedAt - The timestamp to mark as the new sync time
   * @returns A promise that resolves when the scores have been fetched and stored
   * @throws {SupabaseError} If the RPC call to fetch scores fails
   */
  private static async pullUserScores(
    userId: string,
    lastSyncedAt: string = config.database.epochStartDate,
    newSyncedAt: string = new Date().toISOString(),
  ): Promise<UserScoreLocal[]> {
    if (!userId) throw new Error('User ID is required to pull user scores.');
    if (!lastSyncedAt) throw new Error('Last synced timestamp is required to pull user scores.');
    if (!newSyncedAt) throw new Error('New synced timestamp is required to pull user scores.');

    const { data: updatedScores, error: errorFetch } = await supabaseInstance.rpc(
      'fetch_user_scores',
      {
        p_user_id: userId,
        p_last_synced_at: lastSyncedAt,
      },
    );

    if (errorFetch) {
      throw new SupabaseError(`Error fetching User Scores from Supabase.`, errorFetch, {
        userId,
        lastSyncedAt,
      });
    }

    return updatedScores;
  }

  /**
   * Saves user scores to IndexedDB with optional deletion of existing records.
   *
   * @param userId - The unique identifier of the user whose scores are being saved.
   * @param newSyncedAt - The timestamp indicating when the scores were last synced.
   * @param updatedScores - An array of user score records to persist to IndexedDB.
   * @param deleteExisting - Optional flag (default: false) to delete all existing scores for the user before saving new ones.
   *
   * @throws {Error} If updatedScores are not provided.
   * @throws {Error} If userId is not provided.
   * @throws {Error} If newSyncedAt timestamp is not provided.
   *
   * @returns A promise that resolves when the scores have been successfully saved to IndexedDB.
   */
  private static async saveUserScoresToIndexedDB(
    userId: string,
    newSyncedAt: string,
    updatedScores: UserScoreLocal[],
    deleteExisting: boolean = false,
  ): Promise<void> {
    if (!updatedScores)
      throw new Error('Updated scores are required to save user scores to IndexedDB.');
    if (!userId) throw new Error('User ID is required to save user scores to IndexedDB.');
    if (!newSyncedAt)
      throw new Error('New synced timestamp is required to save user scores to IndexedDB.');

    if (!Array.isArray(updatedScores) || updatedScores.length <= 0) return;

    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      if (deleteExisting) await this.deleteAllUserScores(userId);
      await db.user_scores.bulkPut(updatedScores);
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
    });

    const serverUpdatesCount = Array.isArray(updatedScores) ? updatedScores.length : 0;
    infoHandler(
      `Completed ${serverUpdatesCount} user scores pull from Supabase for userId: ${userId}`,
    );
  }
}
