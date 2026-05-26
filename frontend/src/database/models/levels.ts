import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { LevelType, LevelOverviewType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { fetchFromRemoteGeneric, syncFromRemoteGeneric } from '../utils/data-sync.utils';
import { aggregateLevels } from '../utils/levels.utils';
import UserItem from './user-items';
import Lessons from './lessons';

/**
 * Represents a level entity in the local database.
 * Handles synchronization of level data between the remote Supabase server and local storage.
 *
 * @method getAll - Retrieves a comprehensive overview of user levels with their progress.
 * @method syncFromRemote - Synchronizes levels from the remote server with the local database.
 *
 */
export default class Levels extends Entity<AppDB> implements LevelType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  /**
   * Retrieves a comprehensive overview of user levels with their progress.
   * @param userId - The unique identifier of the user
   */
  static async getAll(userId: string): Promise<LevelOverviewType[]> {
    const items = await UserItem.getByUserId(userId);
    const lessons = await Lessons.getAll();
    const levels = await db.levels.orderBy('sort_order').toArray();
    return aggregateLevels(items, lessons, levels);
  }

  /**
   * Synchronizes levels from the remote server with the local database.
   * @param doFullSync - If true, performs a full sync by clearing all existing levels
   *                     and fetching all levels from the epoch start date.
   *                     If false, performs an incremental sync fetching only levels
   *                     modified since the last sync timestamp. Defaults to false.
   * @return The count of level records that were updated from the remote database during this sync operation.
   */
  static async syncFromRemote(doFullSync: boolean = false): Promise<number> {
    return await syncFromRemoteGeneric<LevelType>(
      db.levels as Dexie.Table<LevelType, number>,
      TableName.Levels,
      this.fetchFromRemote,
      doFullSync,
    );
  }

  /**
   * Fetches levels from Supabase that have been updated since the specified timestamp.
   * @param lastSyncedAt - The timestamp of the last sync operation. Defaults to the application's epoch start date.
   */
  private static async fetchFromRemote(lastSyncedAt: string): Promise<LevelType[]> {
    return await fetchFromRemoteGeneric<LevelType>({
      tableName: TableName.Levels,
      select: 'id, name, note, sort_order, deleted_at',
      entityName: 'levels',
      lastSyncedAt,
    });
  }
}
