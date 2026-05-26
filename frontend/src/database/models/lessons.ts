import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { type LessonType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { fetchFromRemoteGeneric, syncFromRemoteGeneric } from '../utils/data-sync.utils';

/**
 * Represents a lesson entity in the local database.
 * Handles synchronization of lesson data between the remote Supabase server and local storage.
 *
 * @method getAll - Retrieves all lessons from the local database ordered by their sort order.
 * @method syncFromRemote - Synchronizes lessons from the remote server with the local database.
 *
 */
export default class Lessons extends Entity<AppDB> implements LessonType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  level_id!: number;
  deleted_at!: string | null;

  /**
   * Retrieves all lessons from the local database ordered by their sort order.
   * @returns An array of lessons
   */
  static async getAll(): Promise<LessonType[]> {
    return await db.lessons.orderBy('sort_order').toArray();
  }

  /**
   * Synchronizes lessons from the remote server with the local database.
   * @param doFullSync - If true, performs a full sync by clearing all existing lessons
   *                     and fetching all lessons from the epoch start date.
   *                     If false, performs an incremental sync fetching only lessons
   *                     modified since the last sync timestamp. Defaults to false.
   * @returns The count of lesson records that were updated from the remote database during this sync operation.
   */
  static async syncFromRemote(doFullSync: boolean = false): Promise<number> {
    return await syncFromRemoteGeneric<LessonType>(
      db.lessons as Dexie.Table<LessonType, number>,
      TableName.Lessons,
      this.fetchFromRemote,
      doFullSync,
    );
  }

  /**
   * Fetches lessons from Supabase that have been updated since the specified timestamp.
   * @param lastSyncedAt - The timestamp of the last sync operation. Defaults to the application's epoch start date.
   */
  private static async fetchFromRemote(lastSyncedAt: string): Promise<LessonType[]> {
    return await fetchFromRemoteGeneric<LessonType>({
      tableName: TableName.Lessons,
      select: 'id, name, note, level_id, sort_order, deleted_at',
      entityName: 'lessons',
      lastSyncedAt,
    });
  }
}
