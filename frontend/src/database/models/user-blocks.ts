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
 * - Grammar transitions: start/master actions used by the triggered new-grammar flow.
 * - Maintenance: grammar/block resets, local account deletion, and remote sync.
 *
 * Block timestamps use the configured null replacement date locally and convert to null for remote sync.
 */
export default class UserBlock extends Entity<AppDB> implements UserBlockType {
  user_id!: string;
  block_id!: number;
  name!: string;
  note!: string | null;
  lesson_id!: number;
  grammar_chunk_id!: number | null;
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
   * Creates the grammar-block portion of the anonymous-user simulation fixture.
   * The first configured number of grammar blocks are started and mastered. The next block stays
   * unstarted so unified practice can discover it as a new-grammar trigger.
   *
   * @param userId Non-empty user id owning the blocks.
   * @param dateTime Shared ISO timestamp for every simulated transition.
   * @returns Number of grammar blocks changed.
   * @throws Error when the required number of practice grammar blocks is unavailable.
   */
  static async simulateGrammarProgress(userId: string, dateTime: string): Promise<number> {
    assertNonEmptyString(userId, 'userId');

    const masteredCount = config.progress.simulationMasteredGrammarBlockCount;
    const requiredCount = masteredCount + 1;
    const grammarBlocks = (await this.getByUserId(userId))
      .filter((block) => block.is_practice_block !== false && !block.is_vocabulary)
      .sort(compareGrammarBlocks)
      .slice(0, requiredCount);

    if (grammarBlocks.length < requiredCount) {
      throw new Error(
        `Simulation requires at least ${requiredCount} practice grammar blocks for user ${userId}.`,
      );
    }

    for (const block of grammarBlocks.slice(0, masteredCount)) {
      await this.unlockBlock(userId, block.block_id, dateTime);
      await this.markBlockMastered(userId, block.block_id, dateTime);
    }

    return masteredCount;
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
  static async resetByGrammarChunkId(
    userId: string,
    grammarChunkId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    assertNonEmptyString(userId, 'userId');

    const blocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter((block) => block.grammar_chunk_id === grammarChunkId)
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

  static async resetByGrammarGroupId(
    userId: string,
    grammarGroupId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    assertNonEmptyString(userId, 'userId');
    const chunkIds = new Set(
      (
        await db.grammar_chunks.where('grammar_group_id').equals(grammarGroupId).toArray()
      ).map((chunk) => chunk.id),
    );
    if (chunkIds.size === 0) return 0;

    const blocks = await db.user_blocks
      .where('user_id')
      .equals(userId)
      .filter(
        (block) =>
          block.grammar_chunk_id != null && chunkIds.has(block.grammar_chunk_id),
      )
      .toArray();
    if (blocks.length === 0) return 0;

    await db.user_blocks.bulkPut(
      blocks.map((block) => ({ ...block, ...getResetBlockFields(dateTime) })),
    );
    return blocks.length;
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
