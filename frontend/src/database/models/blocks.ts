import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { SupabaseError } from '@/types/error.types';
import { type BlockType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { syncFromRemoteGeneric } from '../utils/data-sync.utils';
import UserItem from './user-items';
import { assertNonEmptyString } from '@/utils/assertions.utils';

/**
 * Represents a lesson entity in the local database.
 * Handles synchronization of lesson data between the remote Supabase server and local storage.
 *
 * @method getAll - Retrieves all lessons from the local database.
 * @method syncFromRemote - Synchronizes lessons from the remote server with the local database.
 *
 */
export default class Blocks extends Entity<AppDB> implements BlockType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  /**
   * Retrieves all lessons from the database.
   */
  static async getAll(): Promise<BlockType[]> {
    return await db.blocks.orderBy('sort_order').toArray();
  }

  /**
   * Retrieves all lessons from the database.
   */
  static async getOverviewBlocks(userId: string): Promise<BlockType[]> {
    assertNonEmptyString(userId, 'userId');

    const startedBlockIds = await UserItem.getOverviewBlocksIds(userId);
    const blocks = await db.blocks.where('id').anyOf(startedBlockIds).toArray();

    return blocks.sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Synchronizes lessons from the remote server with the local database.
   * @param doFullSync - If true, performs a full sync by clearing all existing lessons
   *                     and fetching all lessons from the epoch start date.
   *                     If false, performs an incremental sync fetching only lessons
   *                     modified since the last sync timestamp. Defaults to false.
   */
  static async syncFromRemote(doFullSync: boolean = false): Promise<void> {
    await syncFromRemoteGeneric<BlockType>(
      db.blocks as Dexie.Table<BlockType, number>,
      TableName.Blocks,
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
  ): Promise<BlockType[]> {
    const { data: blocks, error } = await supabaseInstance
      .from('blocks')
      .select('id, name, note, sort_order, deleted_at')
      .gt('updated_at', lastSyncedAt);

    if (error) {
      throw new SupabaseError(`Failed to fetch blocks data from supabase`, error, {
        lastSyncedAt,
      });
    }

    return blocks ?? [];
  }
}
