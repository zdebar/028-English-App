import { db } from '@/database/models/db';
import { type BlockType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import UserItem from './user-items';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import SyncEntityModel from './sync-entity-model';

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
export default class Blocks extends SyncEntityModel implements BlockType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.blocks as Dexie.Table<BlockType, number>;
  static override readonly syncTableName = TableName.Blocks;
  static override readonly syncEntityName = 'blocks';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

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
}
