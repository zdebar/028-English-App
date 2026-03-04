import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { SupabaseError } from '@/types/error.types';
import type { LevelLocal, LevelOverview } from '@/types/local.types';
import { TableName } from '@/types/local.types';
import { Entity } from 'dexie';
import { syncFromRemoteGeneric, aggregateLevels } from '../utils/database.utils';
import Dexie from 'dexie';

/**
 * Represents a level entity in the local database.
 * Handles synchronization of level data between the remote Supabase server and local storage.
 *
 * @method getAll - Retrieves all levels from the local database.
 * @method syncLevels - Synchronizes levels from the remote server with the local database.
 *
 */
export default class Levels extends Entity<AppDB> implements LevelLocal {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  /**
   * Retrieves all levels from the database.
   * @returns {Promise<LevelLocal[]>} A promise that resolves to an array of all levels.
   */
  static async getAll(): Promise<LevelLocal[]> {
    return await db.levels.orderBy('sort_order').toArray();
  }

  /**
   * Retrieves a comprehensive overview of user levels with their progress.
   *
   * Fetches all user items, lessons, and levels data, then aggregates them
   * to provide a complete level overview for the specified user.
   *
   * @param userId - The unique identifier of the user
   */
  static async getOverview(userId: string): Promise<LevelOverview[]> {
    const items = await db.user_items.where('user_id').equals(userId).toArray();
    const lessons = await db.lessons.orderBy('sort_order').toArray();
    const levels = await db.levels.orderBy('sort_order').toArray();
    return aggregateLevels(items, lessons, levels);
  }

  /**
   * Synchronizes levels from the remote server with the local database.
   *
   * @param doFullSync - If true, performs a full sync by clearing all existing levels
   *                     and fetching all levels from the epoch start date.
   *                     If false, performs an incremental sync fetching only levels
   *                     modified since the last sync timestamp. Defaults to false.
   *
   * @returns A promise that resolves when the sync operation is complete.
   * @throws Database transaction errors if the sync operation fails
   */
  static async syncFromRemote(doFullSync: boolean = false): Promise<void> {
    await syncFromRemoteGeneric<LevelLocal>(
      db.levels as Dexie.Table<LevelLocal, number>,
      TableName.Levels,
      this.fetchFromRemote,
      doFullSync,
    );
  }

  /**
   * Fetches levels from Supabase that have been updated since the specified timestamp.
   * @param lastSyncedAt - The timestamp of the last sync operation. Defaults to the application's epoch start date.
   * @returns A promise that resolves to an array of local level objects.
   * @throws {SupabaseError} If the RPC call to fetch levels fails, includes the lastSyncedAt parameter in error context.
   */
  private static async fetchFromRemote(
    lastSyncedAt: string = config.database.epochStartDate,
  ): Promise<LevelLocal[]> {
    const { data: levels, error } = await supabaseInstance
      .from('levels')
      .select('id, name, note, sort_order, deleted_at')
      .gt('updated_at', lastSyncedAt);

    if (error) {
      throw new SupabaseError(`Failed to fetch levels data from supabase`, error, {
        lastSyncedAt,
      });
    }

    return levels ?? [];
  }
}
