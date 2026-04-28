import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { SupabaseError } from '@/types/error.types';
import { type LessonType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { syncFromRemoteGeneric } from '../utils/data-sync.utils';

/**
 * Represents a lesson entity in the local database.
 * Handles synchronization of lesson data between the remote Supabase server and local storage.
 *
 * @method getAll - Retrieves all lessons from the local database.
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
   * Retrieves all lessons from the database.
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
   */
  static async syncFromRemote(doFullSync: boolean = false): Promise<void> {
    await syncFromRemoteGeneric<LessonType>(
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
  private static async fetchFromRemote(
    lastSyncedAt: string = config.database.epochStartDate,
  ): Promise<LessonType[]> {
    const { data: lessons, error } = await supabaseInstance
      .from('lessons')
      .select('id, name, note, level_id, sort_order, deleted_at')
      .gt('updated_at', lastSyncedAt);

    if (error) {
      throw new SupabaseError(`Failed to fetch lessons data from supabase`, error, {
        lastSyncedAt,
      });
    }

    return lessons ?? [];
  }
}
