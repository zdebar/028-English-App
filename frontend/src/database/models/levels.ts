import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { infoHandler } from '@/features/logging/info-handler';
import { SupabaseError } from '@/types/error.types';
import { TableName, type LevelLocal } from '@/types/local.types';
import { Entity } from 'dexie';
import { splitDeleted } from '../utils/data-sync.utils';
import Metadata from './metadata';

/**
 * Represents a level entity in the local database.
 * Handles synchronization of level data between the remote Supabase server and local storage.
 *
 * @method getAllLevels - Retrieves all levels from the local database.
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
  static async getAllLevels(): Promise<LevelLocal[]> {
    return await db.levels.orderBy('sort_order').toArray();
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
  static async syncLevels(doFullSync: boolean = false): Promise<void> {
    const lastSyncedAt = doFullSync
      ? config.database.epochStartDate
      : await Metadata.getSyncedAt(TableName.Levels);
    const newSyncedAt = new Date().toISOString();

    const levels = await this.fetchLevels(lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(levels);

    await db.transaction('rw', db.levels, db.metadata, async () => {
      if (doFullSync) {
        await db.levels.clear();
      } else if (toDelete.length > 0) {
        await db.levels.bulkDelete(toDelete.map((item) => item.id));
      }
      if (toUpsert.length > 0) {
        await db.levels.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.Levels, newSyncedAt);
    });

    infoHandler(`Completed ${levels.length} levels pull from Supabase.`);
  }

  /**
   * Fetches levels from Supabase that have been updated since the specified timestamp.
   * @param lastSyncedAt - The timestamp of the last sync operation. Defaults to the application's epoch start date.
   * @returns A promise that resolves to an array of local level objects.
   * @throws {SupabaseError} If the RPC call to fetch levels fails, includes the lastSyncedAt parameter in error context.
   */
  private static async fetchLevels(
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
