import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import { TableName, type LessonLocal } from '@/types/local.types';
import { supabaseInstance } from '@/config/supabase.config';
import { db } from '@/database/models/db';
import config from '@/config/config';
import Metadata from './metadata';
import { splitDeleted } from '../utils/data-sync.utils';
import { infoHandler } from '@/features/logging/info-handler';
import { SupabaseError } from '@/types/error.types';

/**
 * Represents a lesson entity in the local database.
 * Handles synchronization of lesson data between the remote Supabase server and local storage.
 *
 * @method getAllLessons - Retrieves all lessons from the local database.
 * @method syncLessons - Synchronizes lessons from the remote server with the local database.
 *
 */
export default class Lessons extends Entity<AppDB> implements LessonLocal {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  level_id!: number;
  deleted_at!: string | null;

  /**
   * Retrieves all lessons from the database.
   * @returns {Promise<LessonLocal[]>} A promise that resolves to an array of all lessons.
   */
  static async getAllLessons(): Promise<LessonLocal[]> {
    return await db.lessons.orderBy('sort_order').toArray();
  }

  /**
   * Synchronizes lessons from the remote server with the local database.
   *
   * @param doFullSync - If true, performs a full sync by clearing all existing lessons
   *                     and fetching all lessons from the epoch start date.
   *                     If false, performs an incremental sync fetching only lessons
   *                     modified since the last sync timestamp. Defaults to false.
   *
   * @returns A promise that resolves when the sync operation is complete.
   * @throws Database transaction errors if the sync operation fails
   */
  static async syncLessons(doFullSync: boolean = false): Promise<void> {
    // Step 1: Determine the last sync timestamp and the new sync timestamp
    const lastSyncedAt = doFullSync
      ? config.database.epochStartDate
      : await Metadata.getSyncedAt(TableName.Lessons);
    const newSyncedAt = new Date().toISOString();

    // Step 2: Fetch updated lesson records from Supabase based on the last sync timestamp
    const lessons = await this.fetchFromRemote(lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(lessons);

    // Step 3: Update the local database within a transaction to ensure data integrity
    await db.transaction('rw', db.lessons, db.metadata, async () => {
      if (doFullSync) {
        await db.lessons.clear();
      } else if (toDelete.length > 0) {
        await db.lessons.bulkDelete(toDelete.map((item) => item.id));
      }
      if (toUpsert.length > 0) {
        await db.lessons.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.Lessons, newSyncedAt);
    });

    infoHandler(`Completed ${lessons.length} lessons pull from Supabase.`);
  }

  /**
   * Fetches lessons from Supabase that have been updated since the specified timestamp.
   * @param lastSyncedAt - The timestamp of the last sync operation. Defaults to the application's epoch start date.
   * @returns A promise that resolves to an array of local lesson objects.
   * @throws {SupabaseError} If the RPC call to fetch lessons fails, includes the lastSyncedAt parameter in error context.
   */
  private static async fetchFromRemote(
    lastSyncedAt: string = config.database.epochStartDate,
  ): Promise<LessonLocal[]> {
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
