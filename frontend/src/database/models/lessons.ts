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
 * @implements {LessonLocal}
 * @extends {Entity<AppDB>}
 *
 * @property {number} id - The unique identifier for the lesson
 * @property {string} name - The name of the lesson
 * @property {number} sort_order - The display order of the lesson
 * @property {string} level_name - The proficiency level associated with the lesson
 * @property {string | null} deleted_at - Timestamp of when the lesson was deleted, or null if not deleted
 */
export default class Lessons extends Entity<AppDB> implements LessonLocal {
  id!: number;
  name!: string;
  sort_order!: number;
  level_name!: string;
  deleted_at!: string | null;

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
    const lastSyncedAt = doFullSync
      ? config.database.epochStartDate
      : await Metadata.getSyncedAt(TableName.Lessons);
    const newSyncedAt = new Date().toISOString();

    const lessons = await this.fetchLessons(lastSyncedAt);
    const [toUpsert, toDelete] = splitDeleted(lessons);

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
  private static async fetchLessons(
    lastSyncedAt: string = config.database.epochStartDate,
  ): Promise<LessonLocal[]> {
    const { data: lessons, error } = await supabaseInstance.rpc('fetch_lessons', {
      p_last_synced_at: lastSyncedAt,
    });

    if (error) {
      throw new SupabaseError(`Failed to fetch lessons data from supabase`, error, {
        lastSyncedAt,
      });
    }

    return lessons;
  }
}
