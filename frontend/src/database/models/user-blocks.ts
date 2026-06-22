import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { getSyncTimestamps, splitDeleted } from '@/database/utils/sync-generic.utils';
import { reportInfo } from '@/features/logging/monitoring-handler';
import { SupabaseError } from '@/types/error.types';
import type { UserBlockType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { Entity } from 'dexie';
import Metadata from './metadata';

const NULL_DATE = config.database.nullReplacementDate;

type UserBlockAPI = Omit<UserBlockType, 'started_at' | 'next_at' | 'mastered_at' | 'deleted_at'> & {
  started_at: string | null;
  next_at: string | null;
  mastered_at: string | null;
  deleted_at: string | null;
};

type UserBlockExport = Pick<
  UserBlockAPI,
  | 'user_id'
  | 'block_id'
  | 'progress'
  | 'is_vocabulary'
  | 'started_at'
  | 'updated_at'
  | 'next_at'
  | 'mastered_at'
>;

function convertAPIToLocal(block: UserBlockAPI): UserBlockType {
  return {
    ...block,
    started_at: block.started_at ?? NULL_DATE,
    next_at: block.next_at ?? NULL_DATE,
    mastered_at: block.mastered_at ?? NULL_DATE,
    deleted_at: block.deleted_at ?? NULL_DATE,
  };
}

function convertLocalToExport(block: UserBlockType): UserBlockExport {
  return {
    user_id: block.user_id,
    block_id: block.block_id,
    progress: block.progress,
    is_vocabulary: block.is_vocabulary,
    started_at: block.started_at === NULL_DATE ? null : block.started_at,
    updated_at: block.updated_at,
    next_at: block.next_at === NULL_DATE ? null : block.next_at,
    mastered_at: block.mastered_at === NULL_DATE ? null : block.mastered_at,
  };
}

export default class UserBlock extends Entity<AppDB> implements UserBlockType {
  user_id!: string;
  block_id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  progress!: number;
  is_vocabulary!: boolean;
  started_at!: string;
  updated_at!: string;
  next_at!: string;
  mastered_at!: string;
  deleted_at!: string;

  static async getByUserId(userId: string): Promise<UserBlockType[]> {
    assertNonEmptyString(userId, 'userId');

    const blocks = await db.user_blocks.where('user_id').equals(userId).toArray();
    return blocks.sort((left, right) => left.sort_order - right.sort_order);
  }

  static async getByBlockId(userId: string, blockId: number): Promise<UserBlockType | null> {
    assertNonEmptyString(userId, 'userId');

    return (await db.user_blocks.get([userId, blockId])) ?? null;
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db.user_blocks.where('user_id').equals(userId).delete();
  }

  static async syncFromRemote(userId: string, doFullSync: boolean = false): Promise<number> {
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.UserBlocks,
      userId,
    );

    const localBlocks = await this.getUserBlocksForSync(userId, lastSyncedAt, newSyncedAt);
    reportInfo(`Completed ${localBlocks.length} UserBlocks push to remote`);

    const updatedBlocks = await this.syncWithRemote(userId, localBlocks, lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedBlocks);

    await db.transaction('rw', db.user_blocks, db.metadata, async () => {
      if (doFullSync) {
        await this.deleteByUserId(userId);
      } else if (toDelete.length > 0) {
        await db.user_blocks.bulkDelete(toDelete.map((block) => [block.user_id, block.block_id]));
      }
      if (toUpsert.length > 0) {
        await db.user_blocks.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.UserBlocks, newSyncedAt, userId);
    });

    return updatedBlocks.length;
  }

  private static async getUserBlocksForSync(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserBlockExport[]> {
    const localBlocks = await db.user_blocks
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    return localBlocks.map(convertLocalToExport);
  }

  private static async syncWithRemote(
    userId: string,
    blocks: UserBlockExport[],
    lastSyncedAt: string,
  ): Promise<UserBlockType[]> {
    const { data: updatedBlocks, error } = await supabaseInstance.rpc('upsert_fetch_user_blocks', {
      p_user_id: userId,
      p_last_synced_at: lastSyncedAt,
      p_user_blocks: blocks,
    });

    if (error) {
      throw new SupabaseError('Error fetching user_blocks with Supabase.', error, {
        blockCount: blocks.length,
        lastSyncedAt,
      });
    }

    return (updatedBlocks ?? []).map(convertAPIToLocal);
  }
}
