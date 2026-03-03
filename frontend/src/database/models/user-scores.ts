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
import {
  assertIsoDateString,
  assertNonNegativeInteger,
  assertPositiveInteger,
} from '@/utils/assertions.utils';
import { splitDeleted } from '../utils/data-sync.utils';

/**
 * Represents a user score entity in the application database.
 *
 * @method addItemCount - Increases the item count for today's date by the specified amount.
 * @method getUserScoreForToday - Fetches the user score record for today's date.
 * @method syncUserScores - Synchronizes user scores between local database and Supabase.
 * @method deleteAllUserScores - Deletes all user score records for a given user.
 */
export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  user_id!: string;
  date!: string;
  item_count!: number;
  updated_at!: string;
  deleted_at!: string | null;

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
    assertPositiveInteger(addCount, 'addItemCount');

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
   * @returns A promise that resolves when the sync operation completes
   * @throws {Error} Throws an error if userId is not provided
   */
  static async syncUserScores(userId: string, doFullSync: boolean = false): Promise<void> {
    if (!userId) throw new Error('User ID is required to sync user scores.');

    // Step 1: Get the last synced timestamp for user scores
    const lastSyncedAt = doFullSync
      ? config.database.epochStartDate
      : await Metadata.getSyncedAt(TableName.UserScores, userId);
    const newSyncedAt = new Date().toISOString();

    // Step 2: Push local changes to Supabase
    const localScores = await this.getUserScores(userId, lastSyncedAt, newSyncedAt);
    await this.postToRemote(localScores);

    // Step 3: Pull scores from Supabase
    const updatedScores = await this.fetchFromRemote(userId, lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedScores);

    // Step 4: Update local database with fetched scores and update sync metadata
    await db.transaction('rw', db.user_scores, db.metadata, async () => {
      if (doFullSync) {
        await this.deleteAllUserScores(userId);
      } else if (toDelete.length > 0) {
        await db.user_scores.bulkDelete(toDelete.map((item) => [item.user_id, item.date]));
      }
      if (toUpsert.length > 0) {
        await db.user_scores.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.UserScores, newSyncedAt, userId);
    });
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
   * Gets user scores for a specific user that were updated since the last sync time.
   * This is used to determine which local records need to be pushed to the backend during synchronization.
   *
   * @param userId - The ID of the user whose scores should be fetched
   * @param lastSyncedAt - The timestamp of the last sync (defaults to epoch start date)
   * @param newSyncedAt - The timestamp of the new sync
   * @returns A promise that resolves with the fetched scores
   * @throws {SupabaseError} If the RPC call to fetch scores fails
   */
  private static async getUserScores(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserScoreLocal[]> {
    if (!userId) throw new Error('User ID is required to fetch user scores.');
    assertIsoDateString(lastSyncedAt);
    assertIsoDateString(newSyncedAt);

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
   * @param itemCount - The number of items counted in this score. Should be a non-negative integer.
   * @returns A new UserScoreLocal object with the provided data and current timestamp
   */
  private static createRecord(userId: string, date: string, itemCount: number): UserScoreLocal {
    if (!userId) throw new Error('User ID is required to create a user score record.');
    assertIsoDateString(date);
    assertNonNegativeInteger(
      itemCount,
      'itemCount must be a non-negative integer to create a user score record.',
    );

    return {
      user_id: userId,
      date,
      item_count: itemCount,
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
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
  private static async postToRemote(localScores: UserScoreLocal[]): Promise<void> {
    if (!localScores || localScores.length === 0) return;

    const { error: errorInsert } = await supabaseInstance.rpc('upsert_user_scores', {
      p_user_scores: localScores,
    });

    if (errorInsert) {
      throw new SupabaseError(`User score synchronization failed.`, errorInsert, { localScores });
    }

    infoHandler(
      `Completed ${localScores.length} user scores push to Supabase for userId: ${localScores[0].user_id}`,
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
  private static async fetchFromRemote(
    userId: string,
    lastSyncedAt: string = config.database.epochStartDate,
    newSyncedAt: string = new Date().toISOString(),
  ): Promise<UserScoreLocal[]> {
    if (!userId) throw new Error('User ID is required to pull user scores.');
    assertIsoDateString(lastSyncedAt);
    assertIsoDateString(newSyncedAt);

    const { data: updatedScores, error: errorFetch } = await supabaseInstance
      .from('user_scores')
      .select('user_id, date, item_count, updated_at, deleted_at')
      .gt('updated_at', lastSyncedAt)
      .eq('user_id', userId);

    if (errorFetch) {
      throw new SupabaseError(`Error fetching User Scores from Supabase.`, errorFetch, {
        userId,
        lastSyncedAt,
      });
    }

    return updatedScores ?? [];
  }
}
