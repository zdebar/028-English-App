import { db } from '@/database/models/db';
import type { LevelType, LevelOverviewType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import { aggregateLevels } from '../utils/levels.utils';
import UserItem from './user-items';
import Lessons from './lessons';
import SyncEntityModel from './sync-entity-model';

/**
 * Represents a level entity in the local database.
 * Handles synchronization of level data between the remote Supabase server and local storage.
 *
 * @method getOverview - Retrieves a comprehensive overview of user levels with their progress.
 * @method syncFromRemote - Synchronizes levels from the remote server with the local database.
 *
 */
export default class Levels extends SyncEntityModel implements LevelType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.levels as Dexie.Table<LevelType, number>;
  static override readonly syncTableName = TableName.Levels;
  static override readonly syncEntityName = 'levels';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

  /**
   * Retrieves a comprehensive overview of user levels with their progress.
   * @param userId - The unique identifier of the user
   */
  static async getOverview(userId: string): Promise<LevelOverviewType[]> {
    const items = await UserItem.getByUserId(userId);
    const lessons = await Lessons.getAll();
    const levels = await db.levels.orderBy('sort_order').toArray();
    return aggregateLevels(items, lessons, levels);
  }
}
