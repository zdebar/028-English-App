import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { type BlockType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { fetchFromRemoteGeneric, syncFromRemoteGeneric } from '../utils/data-sync.utils';
import UserItem from './user-items';
import { assertNonEmptyString } from '@/utils/assertions.utils';

/**
 * Represents a block entity in the local database.
 * Handles synchronization of block data between the remote Supabase server and local storage.
 *
 * @method getAll - Retrieves all blocks from the local database.
 * @method getById - Retrieves a block by its ID from the local database.
 * @method getOverviewBlocks - Retrieves all overview blocks for a specific user from the local database.
 * @method syncFromRemote - Synchronizes blocks from the remote server with the local database.
 *
 */
export default class Blocks extends Entity<AppDB> implements BlockType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  /**
   * Retrieves all blocks from the database.
   */
  static async getAll(): Promise<BlockType[]> {
    return await db.blocks.orderBy('sort_order').toArray();
  }

  /**
   * Retrieves a block by its ID from the database.
   */
  static async getById(id: number): Promise<BlockType | null> {
    return (await db.blocks.get(id)) ?? null;
  }

  /**
   * Retrieves all overview blocks for a specific user from the database.
   */
  static async getStarted(userId: string): Promise<BlockType[]> {
    assertNonEmptyString(userId, 'userId');

    const startedBlockIds = await UserItem.getStartedBlocksIds(userId);
    const blocks = await db.blocks.where('id').anyOf(startedBlockIds).toArray();

    return blocks.sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Synchronizes blocks from the remote server with the local database.
   * @param doFullSync - If true, performs a full sync by clearing all existing blocks
   *                     and fetching all blocks from the epoch start date.
   *                     If false, performs an incremental sync fetching only blocks
   *                     modified since the last sync timestamp. Defaults to false.
   * @returns The count of block records that were updated from the remote database during this sync operation.
   */
  static async syncFromRemote(doFullSync: boolean = false): Promise<number> {
    return await syncFromRemoteGeneric<BlockType>(
      db.blocks as Dexie.Table<BlockType, number>,
      TableName.Blocks,
      this.fetchFromRemote,
      doFullSync,
    );
  }

  /**
   * Fetches blocks from Supabase that have been updated since the specified timestamp.
   * @param lastSyncedAt - The timestamp of the last sync operation. Defaults to the application's epoch start date.
   */
  private static async fetchFromRemote(lastSyncedAt: string): Promise<BlockType[]> {
    return await fetchFromRemoteGeneric<BlockType>({
      tableName: TableName.Blocks,
      select: 'id, name, note, sort_order, deleted_at',
      entityName: 'blocks',
      lastSyncedAt,
    });
  }
}
