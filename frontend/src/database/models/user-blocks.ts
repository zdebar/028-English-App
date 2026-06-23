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
import Dexie, { Entity } from 'dexie';
import Metadata from './metadata';
import UserItem from './user-items';

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
  | 'started_at'
  | 'updated_at'
  | 'next_at'
  | 'mastered_at'
>;

function convertAPIToLocal(block: UserBlockAPI): UserBlockType {
  return {
    ...block,
    is_vocabulary: block.is_vocabulary,
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
  lesson_id!: number;
  grammar_id!: number | null;
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

  static async getStartedByUserId(userId: string): Promise<UserBlockType[]> {
    assertNonEmptyString(userId, 'userId');

    const [blocks, startedBlockIds] = await Promise.all([
      db.user_blocks.where('user_id').equals(userId).toArray(),
      UserItem.getStartedBlocksIds(userId),
    ]);
    const startedBlockIdSet = new Set(startedBlockIds);

    return blocks
      .filter(
        (block) =>
          (!block.is_vocabulary && block.started_at !== NULL_DATE) ||
          (block.is_vocabulary && startedBlockIdSet.has(block.block_id)),
      )
      .sort((left, right) => left.sort_order - right.sort_order);
  }

  static async getByBlockId(userId: string, blockId: number): Promise<UserBlockType | null> {
    assertNonEmptyString(userId, 'userId');

    return (await db.user_blocks.get([userId, blockId])) ?? null;
  }

  static async getFirstUnlockedGrammarBlock(userId: string): Promise<UserBlockType | null> {
    assertNonEmptyString(userId, 'userId');

    const blocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter(
        (block) =>
          !block.is_vocabulary && block.started_at !== NULL_DATE && block.mastered_at === NULL_DATE,
      )
      .toArray();

    const sortedBlocks = [...blocks].sort(compareGrammarBlocks);
    return sortedBlocks.at(0) ?? null;
  }

  static async getFirstLockedGrammarBlock(userId: string): Promise<UserBlockType | null> {
    assertNonEmptyString(userId, 'userId');

    const blocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter((block) => !block.is_vocabulary && block.started_at === NULL_DATE)
      .toArray();

    const sortedBlocks = [...blocks].sort(compareGrammarBlocks);
    return sortedBlocks.at(0) ?? null;
  }

  static async countReadyGrammarItems(userId: string): Promise<number> {
    assertNonEmptyString(userId, 'userId');

    const now = new Date().toISOString();
    const readyItems = await db.user_items
      .where('[user_id+is_vocabulary+next_at+mastered_at+sort_order]')
      .between(
        [userId, 0, Dexie.minKey, NULL_DATE, Dexie.minKey],
        [userId, 0, now, NULL_DATE, Dexie.maxKey],
        true,
        false,
      )
      .filter((item) => item.mastered_at === NULL_DATE)
      .toArray();

    return readyItems.length;
  }

  static async unlockBlock(userId: string, blockId: number, dateTime: string): Promise<void> {
    assertNonEmptyString(userId, 'userId');

    await db.user_blocks.update([userId, blockId], {
      started_at: dateTime,
      updated_at: dateTime,
    });
  }

  static async markBlockMastered(userId: string, blockId: number, dateTime: string): Promise<void> {
    assertNonEmptyString(userId, 'userId');

    await db.user_blocks.update([userId, blockId], {
      mastered_at: dateTime,
      updated_at: dateTime,
    });
  }

  static async unlockNextGrammarBlock(
    userId: string,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<UserBlockType | null> {
    assertNonEmptyString(userId, 'userId');

    const lockedBlock = await this.getFirstLockedGrammarBlock(userId);
    if (lockedBlock == null) {
      return null;
    }

    const isLessonVocabularyStarted = await UserItem.areAllVocabularyItemsStartedForLesson(
      userId,
      lockedBlock.lesson_id,
    );
    if (!isLessonVocabularyStarted) {
      return null;
    }

    const previousBlock = await this.getPreviousGrammarBlock(userId, lockedBlock);
    if (previousBlock?.mastered_at === NULL_DATE) {
      return null;
    }

    await this.unlockBlock(userId, lockedBlock.block_id, dateTime);
    return {
      ...lockedBlock,
      started_at: dateTime,
      updated_at: dateTime,
    };
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

  private static async getPreviousGrammarBlock(
    userId: string,
    block: UserBlockType,
  ): Promise<UserBlockType | null> {
    const grammarBlocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter((candidate) => !candidate.is_vocabulary)
      .toArray();

    const sortedBlocks = [...grammarBlocks].sort(compareGrammarBlocks);
    const blockIndex = sortedBlocks.findIndex((candidate) => candidate.block_id === block.block_id);
    return blockIndex > 0 ? sortedBlocks[blockIndex - 1] : null;
  }
}

function compareGrammarBlocks(left: UserBlockType, right: UserBlockType): number {
  if (left.lesson_id !== right.lesson_id) {
    return left.lesson_id - right.lesson_id;
  }
  return left.sort_order - right.sort_order;
}
