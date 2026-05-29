import { db } from '@/database/models/db';
import { type LessonType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';

/**
 * Represents a lesson entity in the local database.
 * Handles synchronization of lesson data between the remote Supabase server and local storage.
 *
 * @method getAll - Retrieves all lessons from the local database ordered by their sort order.
 * @method syncFromRemote - Synchronizes lessons from the remote server with the local database.
 *
 */
export default class Lessons extends SyncEntityModel implements LessonType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  level_id!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.lessons as Dexie.Table<LessonType, number>;
  static override readonly syncTableName = TableName.Lessons;
  static override readonly syncEntityName = 'lessons';
  static override readonly syncSelect = 'id, name, note, level_id, sort_order, deleted_at';

  /**
   * Retrieves all lessons from the local database ordered by their sort order.
   * @returns An array of lessons
   */
  static async getAll(): Promise<LessonType[]> {
    return await db.lessons.orderBy('sort_order').toArray();
  }
}
