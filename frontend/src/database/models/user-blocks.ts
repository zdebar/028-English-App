import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { getSyncTimestamps, splitDeleted } from '@/database/utils/sync-generic.utils';
import { reportInfo } from '@/features/logging/monitoring-handler';
import { SupabaseError } from '@/types/error.types';
import type {
  ReadyGrammarPracticeState,
  UserBlockType,
} from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import Dexie, { Entity } from 'dexie';
import Metadata from './metadata';
import UserItem from './user-items';
import { groupReadyPracticeSchedule } from '../utils/ready-practice.utils';

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
    show_in_topics: block.show_in_topics ?? true,
    is_practice_block: block.is_practice_block ?? true,
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

/**
 * Local Dexie model and sync API for user-specific block/topic progress.
 *
 * Public API:
 * - Topic views: `getByUserId`, `getStartedTopicsByUserId`, and `getByBlockId`.
 * - Grammar unlock flow: first locked/unlocked lookups, ready-state checks, and unlock/master/reset actions.
 * - Maintenance: grammar/block resets, local account deletion, and remote sync.
 *
 * Block timestamps use the configured null replacement date locally and convert to null for remote sync.
 */
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
  show_in_topics!: boolean;
  is_practice_block!: boolean;
  started_at!: string;
  updated_at!: string;
  next_at!: string;
  mastered_at!: string;
  deleted_at!: string;

  /**
   * Reads all block rows for a user.
   *
   * @param userId Non-empty user id whose blocks should be read.
   * @returns Blocks sorted by sort_order.
   * @throws Error when userId is empty.
   */
  static async getByUserId(userId: string): Promise<UserBlockType[]> {
    assertNonEmptyString(userId, 'userId');

    const blocks = await db.user_blocks.where('user_id').equals(userId).toArray();
    return blocks.sort((left, right) => left.sort_order - right.sort_order);
  }

  /**
   * Reads blocks that should appear in the started topics overview.
   *
   * @param userId Non-empty user id whose topics should be read.
   * @returns Visible topic blocks sorted by sort_order. Vocabulary blocks are included when at least
   * one item from the block has started; grammar blocks are included when their block progress started.
   * @throws Error when userId is empty.
   */
  static async getStartedTopicsByUserId(userId: string): Promise<UserBlockType[]> {
    assertNonEmptyString(userId, 'userId');

    const [blocks, startedBlockIds] = await Promise.all([
      db.user_blocks.where('user_id').equals(userId).toArray(),
      UserItem.getStartedBlocksIds(userId),
    ]);
    const startedBlockIdSet = new Set(startedBlockIds);

    return blocks
      .filter(
        (block) =>
          block.show_in_topics !== false &&
          (block.is_practice_block === false ||
            (!block.is_vocabulary && block.started_at !== NULL_DATE && block.progress > 0) ||
            (block.is_vocabulary && startedBlockIdSet.has(block.block_id))),
      )
      .sort((left, right) => left.sort_order - right.sort_order);
  }

  /**
   * Looks up a user block by block id.
   *
   * @param userId Non-empty user id owning the block.
   * @param blockId Block id to look up.
   * @returns Matching block, or null when no local row exists.
   * @throws Error when userId is empty.
   */
  static async getByBlockId(userId: string, blockId: number): Promise<UserBlockType | null> {
    assertNonEmptyString(userId, 'userId');

    return (await db.user_blocks.get([userId, blockId])) ?? null;
  }

  /**
   * Finds the first unlocked grammar block that is not yet mastered.
   *
   * @param userId Non-empty user id whose grammar blocks should be inspected.
   * @returns Earliest started, unmastered grammar block, or null when none are available.
   * @throws Error when userId is empty.
   */
  static async getFirstUnlockedGrammarBlock(userId: string): Promise<UserBlockType | null> {
    assertNonEmptyString(userId, 'userId');

    const blocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter(
        (block) =>
          block.is_practice_block !== false &&
          !block.is_vocabulary &&
          block.started_at !== NULL_DATE &&
          block.mastered_at === NULL_DATE,
      )
      .toArray();

    const sortedBlocks = [...blocks].sort(compareGrammarBlocks);
    return sortedBlocks.at(0) ?? null;
  }

  /**
   * Finds the first locked grammar block in lesson/sort order.
   *
   * @param userId Non-empty user id whose grammar blocks should be inspected.
   * @returns Earliest not-started grammar block, or null when none remain locked.
   * @throws Error when userId is empty.
   */
  static async getFirstLockedGrammarBlock(userId: string): Promise<UserBlockType | null> {
    assertNonEmptyString(userId, 'userId');

    const blocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter(
        (block) =>
          block.is_practice_block !== false &&
          !block.is_vocabulary &&
          block.started_at === NULL_DATE,
      )
      .toArray();

    const sortedBlocks = [...blocks].sort(compareGrammarBlocks);
    return sortedBlocks.at(0) ?? null;
  }

  /**
   * Counts grammar review items due now.
   *
   * @param userId User id whose grammar practice state should be read.
   * @returns Number of due grammar items.
   */
  static async countReadyGrammarItems(userId: string): Promise<number> {
    return (await this.getReadyGrammarPracticeState(userId)).readyCount;
  }

  /**
   * Calculates ready grammar review state.
   *
   * @param userId Non-empty user id whose grammar items should be inspected.
   * @returns Ready count plus a grouped future schedule. Never-scheduled items in mastered grammar
   * blocks are ready immediately.
   * @throws Error when userId is empty.
   */
  static async getReadyGrammarPracticeState(userId: string): Promise<ReadyGrammarPracticeState> {
    assertNonEmptyString(userId, 'userId');

    const nowMs = Date.now();
    const masteredGrammarBlockIdSet = new Set(await UserItem.getMasteredGrammarBlockIds(userId));
    const grammarItems = await db.user_items
      .where('[user_id+is_practice_item+is_vocabulary+next_at+mastered_at+sort_order]')
      .between(
        [userId, 1, 0, Dexie.minKey, NULL_DATE, Dexie.minKey],
        [userId, 1, 0, Dexie.maxKey, NULL_DATE, Dexie.maxKey],
        true,
        true,
      )
      .filter(
        (item) =>
          item.mastered_at === NULL_DATE && masteredGrammarBlockIdSet.has(item.block_id),
      )
      .toArray();

    const futureDates: string[] = [];
    let readyCount = 0;

    for (const item of grammarItems) {
      if (item.next_at === NULL_DATE) {
        readyCount += 1;
        continue;
      }

      const nextAtMs = Date.parse(item.next_at);
      if (!Number.isFinite(nextAtMs)) {
        continue;
      }

      if (nextAtMs <= nowMs) {
        readyCount += 1;
      } else {
        futureDates.push(item.next_at);
      }
    }

    return {
      readyCount,
      schedule: groupReadyPracticeSchedule(futureDates),
    };
  }

  /**
   * Marks a grammar block as unlocked/started.
   *
   * @param userId Non-empty user id owning the block.
   * @param blockId Block id to unlock.
   * @param dateTime ISO timestamp written to started_at and updated_at.
   * @throws Error when userId is empty.
   */
  static async unlockBlock(userId: string, blockId: number, dateTime: string): Promise<void> {
    assertNonEmptyString(userId, 'userId');

    await db.user_blocks.update([userId, blockId], {
      started_at: dateTime,
      updated_at: dateTime,
    });
  }

  /**
   * Marks a grammar block as mastered.
   *
   * @param userId Non-empty user id owning the block.
   * @param blockId Block id to master.
   * @param dateTime ISO timestamp written to mastered_at and updated_at.
   * @throws Error when userId is empty.
   */
  static async markBlockMastered(userId: string, blockId: number, dateTime: string): Promise<void> {
    assertNonEmptyString(userId, 'userId');

    await db.user_blocks.update([userId, blockId], {
      mastered_at: dateTime,
      progress: 1,
      updated_at: dateTime,
    });
  }

  /**
   * Resets one user block to its unstarted state.
   *
   * @param userId Non-empty user id owning the block.
   * @param blockId Block id to reset.
   * @param dateTime ISO timestamp written to updated_at. Defaults to now.
   * @throws Error when userId is empty.
   */
  static async resetByBlockId(
    userId: string,
    blockId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<void> {
    assertNonEmptyString(userId, 'userId');

    await db.user_blocks.update([userId, blockId], getResetBlockFields(dateTime));
  }

  /**
   * Resets all blocks tied to a grammar id.
   *
   * @param userId Non-empty user id owning the blocks.
   * @param grammarId Grammar id to match.
   * @param dateTime ISO timestamp written to updated_at. Defaults to now.
   * @returns Number of reset blocks, or 0 when no block matches.
   * @throws Error when userId is empty.
   */
  static async resetByGrammarId(
    userId: string,
    grammarId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    assertNonEmptyString(userId, 'userId');

    const blocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter((block) => block.grammar_id === grammarId)
      .toArray();

    if (blocks.length === 0) {
      return 0;
    }

    await db.user_blocks.bulkPut(
      blocks.map((block) => ({
        ...block,
        ...getResetBlockFields(dateTime),
      })),
    );

    return blocks.length;
  }

  /**
   * Unlocks the next grammar block when lesson and previous-block prerequisites are met.
   *
   * @param userId Non-empty user id whose next grammar block should be considered.
   * @param dateTime ISO timestamp written to started_at and updated_at. Defaults to now.
   * @returns The unlocked block with updated timestamps, or null when no block is eligible.
   * @throws Error when userId is empty.
   */
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

  /**
   * Deletes all local block rows for an account being removed.
   *
   * @param userId User id whose local block rows should be deleted.
   */
  static async deleteByUserId(userId: string): Promise<void> {
    await db.user_blocks.where('user_id').equals(userId).delete();
  }

  /**
   * Pushes local block changes and applies remote block changes.
   *
   * @param userId User id whose block rows should sync.
   * @param doFullSync When true, local rows are cleared before applying remote rows from the epoch.
   * Defaults to false for incremental sync.
   * @returns Number of block rows returned by the remote sync RPC.
   * @throws SupabaseError when the sync RPC fails.
   * @throws Error when sync metadata userId validation fails.
   */
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

  /**
   * Reads local block rows that changed inside a sync window.
   *
   * @param userId User id whose local block rows should be exported.
   * @param lastSyncedAt Inclusive lower updated_at bound.
   * @param newSyncedAt Exclusive upper updated_at bound.
   * @returns Block rows converted to the remote export shape.
   */
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

  /**
   * Calls the Supabase block sync RPC.
   *
   * @param userId User id passed to the RPC.
   * @param blocks Local block rows to upsert remotely before fetching remote changes.
   * @param lastSyncedAt Inclusive remote change lower bound.
   * @returns Remote block rows converted to local shape, or [] when none are returned.
   * @throws SupabaseError when the RPC fails.
   */
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

  /**
   * Finds the grammar block immediately before another grammar block.
   *
   * @param userId User id whose grammar blocks should be inspected.
   * @param block Reference grammar block.
   * @returns Previous grammar block in lesson/sort order, or null when the block is first.
   */
  private static async getPreviousGrammarBlock(
    userId: string,
    block: UserBlockType,
  ): Promise<UserBlockType | null> {
    const grammarBlocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter((candidate) => candidate.is_practice_block !== false && !candidate.is_vocabulary)
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

function getResetBlockFields(dateTime: string): Pick<
  UserBlockType,
  'started_at' | 'next_at' | 'mastered_at' | 'progress' | 'updated_at'
> {
  return {
    started_at: NULL_DATE,
    next_at: NULL_DATE,
    mastered_at: NULL_DATE,
    progress: 0,
    updated_at: dateTime,
  };
}
