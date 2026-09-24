import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type {
  PracticeDeckItem,
  PracticeOutcome,
  UserItemLocal,
  CurriculumSortPath,
  InitialTrainingSelection,
} from '@/types/user-item.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { getSyncTimestamps, splitDeleted } from '../utils/sync-generic.utils';

import { getNextAt, resetUserItem } from '@/database/utils/user-items.utils';
import { SupabaseError } from '@/types/error.types';
import type { ReadyPracticeState } from '@/types/generic.types';
import Metadata from './metadata';
import { reportInfo } from '@/features/logging/monitoring-handler';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { getEffectiveProgress, isInitiated } from '@/utils/progress.utils';

const NULL_DATE = config.database.nullReplacementDate;
const NULL_NUMBER = config.database.nullReplacementNumber;
const SIM_ITEM_COUNT = config.progress.simulationItemCount;
const SIM_ITEM_PROGRESS = config.progress.simulationItemProgress;

type UserItemAPI = Omit<
  UserItemLocal,
  | 'is_vocabulary'
  | 'block_id'
  | 'topic_id'
  | 'grammar_chunk_id'
  | 'started_at'
  | 'deleted_at'
  | 'next_at_cz_to_en'
  | 'mastered_at_cz_to_en'
> & {
  is_vocabulary: boolean;
  block_id: number | null;
  topic_id: number | null;
  grammar_chunk_id: number | null;
  started_at: string | null;
  deleted_at: string | null;
  next_at_cz_to_en: string | null;
  mastered_at_cz_to_en: string | null;
};

type UserItemExport = Pick<
  UserItemAPI,
  | 'user_id'
  | 'item_id'
  | 'progress_cz_to_en'
  | 'started_at'
  | 'updated_at'
  | 'next_at_cz_to_en'
  | 'mastered_at_cz_to_en'
>;

function convertLocalToExport(localItem: UserItemLocal): UserItemExport {
  const {
    user_id,
    item_id,
    progress_cz_to_en,
    updated_at,
    started_at,
    next_at_cz_to_en,
    mastered_at_cz_to_en,
  } = localItem;
  return {
    user_id,
    item_id,
    progress_cz_to_en,
    updated_at,
    started_at: started_at === NULL_DATE ? null : started_at,
    next_at_cz_to_en: next_at_cz_to_en === NULL_DATE ? null : next_at_cz_to_en,
    mastered_at_cz_to_en: mastered_at_cz_to_en === NULL_DATE ? null : mastered_at_cz_to_en,
  };
}

function convertAPIToLocal(apiItem: UserItemAPI): UserItemLocal {
  return {
    ...apiItem,
    is_vocabulary: apiItem.is_vocabulary ? 1 : 0,
    started_at: replaceNullDate(apiItem.started_at),
    next_at_cz_to_en: replaceNullDate(apiItem.next_at_cz_to_en),
    mastered_at_cz_to_en: replaceNullDate(apiItem.mastered_at_cz_to_en),
    deleted_at: replaceNullDate(apiItem.deleted_at),
    block_id: replaceNullNumber(apiItem.block_id),
    topic_id: replaceNullNumber(apiItem.topic_id),
    grammar_chunk_id: replaceNullNumber(apiItem.grammar_chunk_id),
  };
}

function replaceNullDate(value: string | null): string {
  return value ?? NULL_DATE;
}

function replaceNullNumber(value: number | null): number {
  return value ?? NULL_NUMBER;
}

async function getUnstartedItems(userId: string): Promise<UserItemLocal[]> {
  const items = await db.user_items.where('user_id').equals(userId).toArray();
  return items
    .filter(
      (item) =>
        item.deleted_at === NULL_DATE &&
        item.started_at === NULL_DATE &&
        !isInitialTrainingSkipped(item),
    )
    .sort((left, right) =>
      compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path),
    );
}

async function getBlockTrainingSelection(
  firstItem: UserItemLocal,
  unstartedItems: UserItemLocal[],
): Promise<InitialTrainingSelection | null> {
  const block = await db.blocks.get(firstItem.block_id);
  if (!block) return null;
  return {
    blockId: firstItem.block_id,
    items: unstartedItems.filter((item) => item.block_id === firstItem.block_id),
  };
}

function getVocabularyTrainingSelection(
  unstartedItems: UserItemLocal[],
  batchSize: number,
): InitialTrainingSelection {
  return {
    blockId: null,
    items: unstartedItems
      .filter((item) => item.is_vocabulary === 1 && item.block_id === NULL_NUMBER)
      .slice(0, batchSize),
  };
}

function getGrammarTrainingSelection(
  firstItem: UserItemLocal,
  unstartedItems: UserItemLocal[],
  batchSize: number,
): InitialTrainingSelection {
  const items: UserItemLocal[] = [];
  for (const item of unstartedItems) {
    const crossesBoundary =
      item.is_vocabulary !== firstItem.is_vocabulary ||
      (item.is_vocabulary === 0 && item.lesson_id !== firstItem.lesson_id) ||
      item.block_id !== NULL_NUMBER;
    if (crossesBoundary || items.length === batchSize) break;
    items.push(item);
  }
  return { blockId: null, items };
}

async function resolveInitialTrainingSelection(
  unstartedItems: UserItemLocal[],
  batchSize: number,
): Promise<InitialTrainingSelection | null> {
  const firstItem = unstartedItems[0];
  if (!firstItem) return null;
  if (firstItem.block_id !== NULL_NUMBER) {
    return getBlockTrainingSelection(firstItem, unstartedItems);
  }
  if (firstItem.is_vocabulary === 1) {
    return getVocabularyTrainingSelection(unstartedItems, batchSize);
  }
  return getGrammarTrainingSelection(firstItem, unstartedItems, batchSize);
}

/**
 * Local Dexie model and sync API for user-specific vocabulary and grammar item progress.
 *
 * Public API:
 * - Review flow: `getReviewDeck`, `savePracticeDeck`, and `getReadyReviewState`.
 * - Progress lookups: initiated grammar chunks, topic items, and vocabulary.
 * - New-block completion.
 * - Maintenance: reset helpers, simulation data, local account deletion, and remote sync.
 *
 * Dates use the configured null replacement date locally and convert to null for remote sync.
 */
export default class UserItem extends Entity<AppDB> implements UserItemLocal {
  item_id!: number;
  user_id!: string;
  czech!: string;
  english!: string;
  pronunciation!: string;
  audio!: string | null;
  is_vocabulary!: 0 | 1; // boolean represented as 0 or 1
  sort_order!: number;
  curriculum_sort_path!: CurriculumSortPath;
  note_id!: number;
  block_id!: number;
  topic_id!: number;
  grammar_chunk_id!: number;
  progress_cz_to_en!: number;
  started_at!: string;
  updated_at!: string;
  deleted_at!: string;
  next_at_cz_to_en!: string;
  mastered_at_cz_to_en!: string;
  lesson_id!: number;

  /**
   * Returns all due CZ-to-EN review items.
   * @param now Fixed current time shared with availability counts.
   */
  static async getReviewDeck(
    userId: string,
    now: string = new Date().toISOString(),
  ): Promise<PracticeDeckItem[]> {
    return this.getDuePracticeItems(userId, Number.MAX_SAFE_INTEGER, now);
  }

  /**
   * Persists practice progress for the provided items in one transaction.
   *
   * Missing, deleted, or already-mastered items are silently skipped.
   * Empty arrays are ignored.
   */
  static async savePracticeDeck(items: PracticeDeckItem[]): Promise<void> {
    if (!items || items.length === 0) return;

    await db.transaction('rw', db.user_items, async () => {
      const updates: Array<{
        key: [string, number];
        changes: Partial<UserItemLocal>;
      }> = [];

      for (const item of items) {
        const currentItem = await db.user_items.get([item.user_id, item.item_id]);
        if (currentItem?.deleted_at !== NULL_DATE) continue;
        if (currentItem.mastered_at_cz_to_en !== NULL_DATE) continue;

        updates.push({
          key: [item.user_id, item.item_id],
          changes: {
            progress_cz_to_en: item.progress_cz_to_en,
            started_at: item.started_at,
            updated_at: item.updated_at,
            next_at_cz_to_en: item.next_at_cz_to_en,
            mastered_at_cz_to_en: item.mastered_at_cz_to_en,
          },
        });
      }

      if (updates.length > 0) {
        await db.user_items.bulkUpdate(updates);
      }
    });
  }

  /**
   * Reads every local user item row.
   *
   * @returns All rows from IndexedDB, including non-practice and deleted rows.
   */
  static async getAll(): Promise<UserItemLocal[]> {
    return await db.user_items.toCollection().toArray();
  }

  /**
   * Reads practice item rows for a user.
   *
   * @param userId User id whose items should be read.
   * @returns User rows filtered to practice items.
   */
  static async getByUserId(userId: string): Promise<UserItemLocal[]> {
    return db.user_items.where('user_id').equals(userId).toArray();
  }

  /**
   * Reads user items for one block.
   *
   * @param userId User id whose block items should be read.
   * @param blockId Block id to match.
   * @returns Matching items sorted by sort_order.
   */
  static async getByBlockId(userId: string, blockId: number): Promise<UserItemLocal[]> {
    const blockItems = await db.user_items
      .where('[user_id+block_id]')
      .equals([userId, blockId])
      .toArray();

    return blockItems.sort((a, b) => a.sort_order - b.sort_order);
  }

  static async getByItemIds(userId: string, itemIds: readonly number[]): Promise<UserItemLocal[]> {
    if (itemIds.length === 0) return [];
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf([...new Set(itemIds)].map((itemId) => [userId, itemId]))
      .toArray();
    return items.sort((left, right) =>
      compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path),
    );
  }

  /** Builds the next initial-training queue from unstarted curriculum items. */
  static async getNextInitialTrainingSelection(
    userId: string,
    batchSize: number = config.practice.initialTrainingBatchSize,
  ): Promise<InitialTrainingSelection | null> {
    assertNonEmptyString(userId, 'userId');
    if (batchSize <= 0) return null;

    const unstartedItems = await getUnstartedItems(userId);
    return resolveInitialTrainingSelection(unstartedItems, batchSize);
  }

  /**
   * Finalizes progress for all items in a completed initial-training batch.
   *
   * @param userId User id whose block items should be updated.
   * @param itemIds Item ids whose initial-training state should be finalized.
   * @param dateTime ISO timestamp used for started_at and updated_at. Defaults to now.
   * @returns Updated items that were written to IndexedDB; [] when the block has no items.
   */
  static async saveInitialTrainingCompletion(
    userId: string,
    itemIds: readonly number[],
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<UserItemLocal[]> {
    return db.transaction('rw', db.user_items, async () =>
      this.saveInitialTrainingCompletionInternal(userId, itemIds, dateTime),
    );
  }

  private static async saveInitialTrainingCompletionInternal(
    userId: string,
    itemIds: readonly number[],
    dateTime: string,
  ): Promise<UserItemLocal[]> {
    if (itemIds.length === 0) return [];
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(itemIds.map((itemId) => [userId, itemId]))
      .toArray();
    if (items.length !== new Set(itemIds).size) {
      throw new Error('Initial-training completion references missing items.');
    }

    const updatedItems = items.map((item) => {
      const progressCzToEn = item.progress_cz_to_en;
      const nextAtCzToEn = getNextAt(progressCzToEn);
      const masteredAtCzToEn = resolveMasteredAt(
        progressCzToEn,
        item.mastered_at_cz_to_en,
        dateTime,
      );

      return {
        ...item,
        progress_cz_to_en: progressCzToEn,
        started_at: getCompletionStartedAt(item, dateTime),
        updated_at: dateTime,
        next_at_cz_to_en: getNextAtForMastery(nextAtCzToEn, masteredAtCzToEn),
        mastered_at_cz_to_en: masteredAtCzToEn,
      };
    });

    if (updatedItems.length > 0) {
      await db.user_items.bulkPut(updatedItems);
    }

    return updatedItems;
  }

  /** Reads initiated items assigned to one topic, ordered by curriculum position. */
  static async getInitiatedByTopicId(userId: string, topicId: number): Promise<UserItemLocal[]> {
    const topicItems = await db.user_items
      .where('[user_id+topic_id]')
      .equals([userId, topicId])
      .filter((item) => item.deleted_at === NULL_DATE && isInitiated(item))
      .toArray();

    return topicItems.sort((left, right) =>
      compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path),
    );
  }

  /**
   * Returns whether the user has at least one initiated grammar practice item.
   *
   * @param userId User id whose grammar availability should be checked.
   */
  static async hasInitiatedGrammar(userId: string): Promise<boolean> {
    const initiatedItem = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, true)
      .filter(
        (item) => item.deleted_at === NULL_DATE && isInitiated(item) && hasGrammarChunk(item),
      )
      .first();

    return initiatedItem !== undefined;
  }

  /**
   * Reads unique grammar ids from initiated practice items.
   *
   * @param userId User id whose started items should be inspected.
   * @returns Unique non-null-replacement grammar ids.
   */
  static async getInitiatedGrammarChunkIds(userId: string): Promise<number[]> {
    const initiatedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, true)
      .filter(
        (item) => item.deleted_at === NULL_DATE && isInitiated(item) && hasGrammarChunk(item),
      )
      .toArray();

    return [...new Set(initiatedItems.map((item) => item.grammar_chunk_id))];
  }

  /**
   * Reads initiated vocabulary practice items for a user.
   *
   * @param userId User id whose vocabulary items should be read.
   * @returns Vocabulary practice items that have been initiated.
   */
  static async getInitiatedVocabulary(userId: string): Promise<UserItemLocal[]> {
    const result = await db.user_items
      .where('[user_id+is_vocabulary+started_at]')
      .between([userId, 1, Dexie.minKey], [userId, 1, NULL_DATE], true, true)
      .filter((item) => item.deleted_at === NULL_DATE && isInitiated(item))
      .toArray();
    return result;
  }

  /** Checks availability without materializing the vocabulary list. */
  static async hasInitiatedVocabulary(userId: string): Promise<boolean> {
    const item = await db.user_items
      .where('[user_id+is_vocabulary+started_at]')
      .between([userId, 1, Dexie.minKey], [userId, 1, NULL_DATE], true, true)
      .filter((candidate) => candidate.deleted_at === NULL_DATE && isInitiated(candidate))
      .first();
    return item !== undefined;
  }

  /**
   * Calculates when the minimum review direction can be started.
   *
   * @param userId Non-empty user id whose vocabulary items should be inspected.
   * @returns The earliest date when a complete review deck will be available.
   * @throws Error when userId is empty.
   */
  static async getReadyReviewState(userId: string): Promise<ReadyPracticeState> {
    assertNonEmptyString(userId, 'userId');

    const deckSize = config.practice.reviewMinimumSize;
    const nowIso = new Date(Date.now()).toISOString();

    return { reviewReadyAt: await getReviewReadyAt(userId, deckSize, nowIso) };
  }

  /**
   * Resets one user item while preserving its started state.
   *
   * @param userId User id owning the item.
   * @param itemId Item id to reset.
   * @returns The reset item id.
   * @throws Error when no matching user item exists.
   */
  static async resetItemById(
    userId: string,
    itemId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    const item = await db.user_items.where('[user_id+item_id]').equals([userId, itemId]).first();
    if (!item) {
      throw new Error(`No user items found for item ID ${itemId}.`);
    }
    await resetItems([item], dateTime);
    return itemId;
  }

  /**
   * Resets initiated user items for one grammar topic.
   *
   * @param userId User id owning the items.
   * @param grammarChunkId Grammar chunk id whose initiated items should be reset.
   * @returns Number of modified rows.
   */
  static async resetItemsByGrammarChunkId(
    userId: string,
    grammarChunkId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    const items = await db.user_items
      .where('[user_id+grammar_chunk_id+started_at]')
      .between(
        [userId, grammarChunkId, Dexie.minKey],
        [userId, grammarChunkId, NULL_DATE],
        true,
        true,
      )
      .filter((item) => item.deleted_at === NULL_DATE && isInitiated(item))
      .toArray();

    return resetItems(items, dateTime);
  }

  static async resetItemsByGrammarGroupId(
    userId: string,
    grammarGroupId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    const chunks = await db.grammar_chunks
      .where('grammar_group_id')
      .equals(grammarGroupId)
      .toArray();
    const counts = await Promise.all(
      chunks.map((chunk) => this.resetItemsByGrammarChunkId(userId, chunk.id, dateTime)),
    );
    return counts.reduce((total, count) => total + count, 0);
  }

  /**
   * Resets all user items in one block.
   *
   * @param userId User id owning the items.
   * @param blockId Block id whose items should be reset.
   * @returns Number of modified rows.
   */
  static async resetItemsByBlockId(
    userId: string,
    blockId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    const items = await db.user_items
      .where('[user_id+block_id]')
      .equals([userId, blockId])
      .toArray();

    return resetItems(items, dateTime);
  }

  /** Resets all user items assigned to one topic. */
  static async resetItemsByTopicId(
    userId: string,
    topicId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    const items = await db.user_items
      .where('[user_id+topic_id]')
      .equals([userId, topicId])
      .toArray();
    return resetItems(items, dateTime);
  }

  /**
   * Deletes all local item rows for an account being removed.
   *
   * @param userId User id whose local item rows should be deleted.
   * @returns true after IndexedDB deletion completes.
   */
  static async deleteByUserId(userId: string): Promise<boolean> {
    await db.user_items.where('user_id').equals(userId).delete();
    return true;
  }

  /** Returns up to the configured maximum item rows used by the simulation fixture. */
  static async getSimulationCandidates(userId: string): Promise<UserItemLocal[]> {
    assertNonEmptyString(userId, 'userId');

    return db.user_items
      .where('[user_id+item_id]')
      .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
      .limit(SIM_ITEM_COUNT)
      .toArray();
  }

  /** Replaces progress on simulation candidates with one deterministic fixture. */
  static async simulateData(items: UserItemLocal[], dateTime: string): Promise<number> {
    const simulatedItems = items.map((item) => {
      return {
        ...item,
        progress_cz_to_en: SIM_ITEM_PROGRESS,
        started_at: dateTime,
        updated_at: dateTime,
        next_at_cz_to_en: dateTime,
        mastered_at_cz_to_en: NULL_DATE,
      };
    });

    await db.user_items.bulkPut(simulatedItems);
    return simulatedItems.length;
  }

  /**
   * Pushes local item changes and applies remote item changes.
   *
   * @param userId User id whose item rows should sync.
   * @param doFullSync When true, local rows are cleared before applying remote rows from the epoch.
   * When false, only remote tombstones are deleted locally.
   * @returns Number of item rows returned by the remote sync RPC.
   * @throws SupabaseError when the sync RPC fails.
   * @throws Error when sync metadata userId validation fails.
   */
  static async syncFromRemote(userId: string, doFullSync: boolean): Promise<number> {
    // Step 1: Get the last synced timestamp and establish this sync window.
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.UserItems,
      userId,
    );

    // Step 2: Push local changes and pull updates in a single RPC call
    const localItems = await this.getUserItemsForSync(userId, lastSyncedAt, newSyncedAt);
    reportInfo(`Completed ${localItems.length} UserItems push to remote`);

    const updatedItems = await this.syncWithRemote(userId, localItems, lastSyncedAt, newSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedItems);

    // Step 4: Update local database with fetched items and update sync metadata
    await db.transaction('rw', db.user_items, db.metadata, async () => {
      if (doFullSync) {
        await this.deleteByUserId(userId);
      } else if (toDelete.length > 0) {
        await db.user_items.bulkDelete(toDelete.map((item) => [item.user_id, item.item_id]));
      }
      if (toUpsert.length > 0) {
        await db.user_items.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.UserItems, newSyncedAt, userId);
    });

    return updatedItems.length;
  }

  /**
   * Reads local item rows that changed inside a sync window.
   *
   * @param userId User id whose local item rows should be exported.
   * @param lastSyncedAt Exclusive lower updated_at bound.
   * @param newSyncedAt Inclusive upper updated_at bound.
   * @returns Item rows converted to the remote export shape.
   */
  private static async getUserItemsForSync(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserItemExport[]> {
    const localUserItems: UserItemLocal[] = await db.user_items
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], false, true)
      .toArray();

    return localUserItems.map(convertLocalToExport);
  }

  /**
   * Calls the Supabase item sync RPC.
   *
   * @param userId User id passed to the RPC.
   * @param items Local item rows to upsert remotely before fetching remote changes.
   * @param lastSyncedAt Exclusive remote change lower bound.
   * @returns Remote item rows converted to local shape, or [] when none are returned.
   * @throws SupabaseError when the RPC fails.
   */
  private static async syncWithRemote(
    userId: string,
    items: UserItemExport[],
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserItemLocal[]> {
    const { data: updatedUserItems, error: rpcFetchError } = await supabaseInstance.rpc(
      'upsert_fetch_user_items',
      {
        p_user_id: userId,
        p_last_synced_at: lastSyncedAt,
        p_sync_until: newSyncedAt,
        p_user_items: items,
      },
    );

    if (rpcFetchError) {
      throw new SupabaseError('Error fetching user_items with Supabase.', rpcFetchError, {
        itemCount: items.length,
        lastSyncedAt,
        newSyncedAt,
      });
    }

    if (!updatedUserItems || updatedUserItems.length === 0) return [];
    return updatedUserItems.map(convertAPIToLocal);
  }

  /** Reads due, unmastered CZ-to-EN practice items. */
  private static async getDuePracticeItems(
    userId: string,
    limit: number,
    now: string,
  ): Promise<PracticeDeckItem[]> {
    return this.getDuePracticeCollection(userId, now)
      .limit(limit)
      .toArray();
  }

  private static getDuePracticeCollection(userId: string, now: string) {
    const matchesItem = (item: UserItemLocal) => {
      if (item.deleted_at !== NULL_DATE || item.started_at === NULL_DATE) return false;
      if (item.mastered_at_cz_to_en !== NULL_DATE) return false;

      const nextAt = item.next_at_cz_to_en;
      if (nextAt === NULL_DATE) {
        return getEffectiveProgress(item) === 0;
      }
      return nextAt < now;
    };

    return db.user_items
      .where(getPracticeIndex())
      .between(
        [userId, Dexie.minKey, Dexie.minKey, Dexie.minKey],
        [userId, Dexie.maxKey, Dexie.maxKey, Dexie.maxKey],
        true,
        true,
      )
      .filter(matchesItem);
  }

  /** Applies one CZ-to-EN practice outcome. */
  static applyPracticeProgress(
    item: UserItemLocal,
    outcome: PracticeOutcome,
    dateTime: string,
    options: {
      initialTraining?: boolean;
    } = {},
  ): UserItemLocal {
    if (options.initialTraining === true) {
      return applyInitialTrainingProgress(item, outcome, dateTime);
    }
    return applyReviewProgress(item, outcome, dateTime);
  }
}

async function getReviewReadyAt(
  userId: string,
  deckSize: number,
  nowIso: string,
): Promise<string | null> {
  const scheduledReadyItems = await getScheduledReadyPracticeCollection(userId, nowIso)
    .limit(deckSize)
    .toArray();
  let readyCount = scheduledReadyItems.length;

  if (readyCount < deckSize) {
    const resetReadyItems = await getResetReadyPracticeCollection(userId)
      .limit(deckSize - readyCount)
      .toArray();
    readyCount += resetReadyItems.length;
  }

  if (readyCount >= deckSize) return nowIso;

  const missingCount = deckSize - readyCount;
  const futureItems = await getFuturePracticeCollection(userId, nowIso)
    .limit(missingCount)
    .toArray();
  const thresholdItem = futureItems[missingCount - 1];
  if (!thresholdItem) return null;
  return thresholdItem.next_at_cz_to_en;
}

function getPracticeIndex(): string {
  return '[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]';
}

function getPracticeIndexCollection() {
  return db.user_items.where(getPracticeIndex());
}

function isReadyPracticeItem(item: UserItemLocal): boolean {
  if (item.deleted_at !== NULL_DATE) return false;
  if (item.started_at === NULL_DATE) return false;
  return item.mastered_at_cz_to_en === NULL_DATE;
}

function isScheduledReadyPracticeItem(item: UserItemLocal, nowIso: string): boolean {
  if (!isReadyPracticeItem(item)) return false;
  const nextAt = item.next_at_cz_to_en;
  return nextAt !== NULL_DATE && nextAt <= nowIso && Number.isFinite(Date.parse(nextAt));
}

function isResetReadyPracticeItem(item: UserItemLocal): boolean {
  if (!isReadyPracticeItem(item)) return false;
  return getEffectiveProgress(item) === 0;
}

function isFuturePracticeItem(item: UserItemLocal, nowIso: string): boolean {
  if (!isReadyPracticeItem(item)) return false;
  const nextAt = item.next_at_cz_to_en;
  return nextAt !== NULL_DATE && nextAt > nowIso && Number.isFinite(Date.parse(nextAt));
}

function getScheduledReadyPracticeCollection(userId: string, nowIso: string) {
  return getPracticeIndexCollection()
    .between(
      [userId, Dexie.minKey, Dexie.minKey, Dexie.minKey],
      [userId, nowIso, Dexie.maxKey, Dexie.maxKey],
      true,
      true,
    )
    .filter((item) => isScheduledReadyPracticeItem(item, nowIso));
}

function getResetReadyPracticeCollection(userId: string) {
  return getPracticeIndexCollection()
    .between(
      [userId, NULL_DATE, Dexie.minKey, Dexie.minKey],
      [userId, NULL_DATE, Dexie.maxKey, Dexie.maxKey],
      true,
      true,
    )
    .filter((item) => isResetReadyPracticeItem(item));
}

function getFuturePracticeCollection(userId: string, nowIso: string) {
  return getPracticeIndexCollection()
    .between(
      [userId, nowIso, Dexie.minKey, Dexie.minKey],
      [userId, Dexie.maxKey, Dexie.maxKey, Dexie.maxKey],
      false,
      true,
    )
    .filter((item) => isFuturePracticeItem(item, nowIso));
}

function isInitialTrainingSkipped(
  item: Pick<UserItemLocal, 'started_at' | 'mastered_at_cz_to_en'>,
): boolean {
  return (
    item.started_at === NULL_DATE &&
    (item.mastered_at_cz_to_en ?? NULL_DATE) !== NULL_DATE
  );
}

function applyInitialTrainingProgress(
  item: UserItemLocal,
  outcome: PracticeOutcome,
  dateTime: string,
): UserItemLocal {
  const changes: Partial<UserItemLocal> = {
    ...item,
    started_at: outcome === 'skip' ? NULL_DATE : getStartedAt(item, dateTime),
    updated_at: dateTime,
  };

  if (outcome === 'correct') {
    initializeProgress(changes);
  } else if (outcome === 'skip') {
    setMastered(changes, dateTime);
  } else {
    initializeProgress(changes);
  }

  return { ...item, ...changes };
}

function applyReviewProgress(
  item: UserItemLocal,
  outcome: PracticeOutcome,
  dateTime: string,
): UserItemLocal {
  const currentProgress = getEffectiveProgress(item);
  const changes: Partial<UserItemLocal> = {
    ...item,
    started_at: getStartedAt(item, dateTime),
    updated_at: dateTime,
  };

  if (outcome === 'correct') {
    setProgress(changes, item, currentProgress + 1, dateTime);
  } else if (outcome === 'incorrect') {
    setProgress(changes, item, Math.max(0, currentProgress - 1), dateTime);
  } else {
    setMastered(changes, dateTime, currentProgress);
  }

  return { ...item, ...changes };
}

function getStartedAt(item: UserItemLocal, dateTime: string): string {
  if (item.started_at === NULL_DATE) return dateTime;
  return item.started_at;
}

function getCompletionStartedAt(item: UserItemLocal, dateTime: string): string {
  if (isInitialTrainingSkipped(item)) return NULL_DATE;
  if (item.started_at === NULL_DATE) return dateTime;
  return item.started_at;
}

function setProgress(
  target: Partial<UserItemLocal>,
  original: UserItemLocal,
  progress: number,
  dateTime: string,
): void {
  const masteredAt = resolveMasteredAt(
    progress,
    original.mastered_at_cz_to_en,
    dateTime,
  );

  target.progress_cz_to_en = progress;
  target.next_at_cz_to_en = getNextAtForMastery(getNextAt(progress), masteredAt);
  target.mastered_at_cz_to_en = masteredAt;
}

function initializeProgress(target: Partial<UserItemLocal>): void {
  target.progress_cz_to_en = 0;
  target.next_at_cz_to_en = getNextAt(0);
  target.mastered_at_cz_to_en = NULL_DATE;
}

function setMastered(
  target: Partial<UserItemLocal>,
  dateTime: string,
  progress: number = 0,
): void {
  target.progress_cz_to_en = progress;
  target.next_at_cz_to_en = NULL_DATE;
  target.mastered_at_cz_to_en = dateTime;
}

function getNextAtForMastery(nextAt: string, masteredAt: string): string {
  if (masteredAt !== NULL_DATE) return NULL_DATE;
  return nextAt;
}

function resolveMasteredAt(
  progress: number,
  currentMasteredAt: string,
  dateTime: string,
): string {
  if (progress < config.srs.intervals.length) return currentMasteredAt;
  if (currentMasteredAt !== NULL_DATE) return currentMasteredAt;
  return dateTime;
}

function hasGrammarChunk(item: Pick<UserItemLocal, 'grammar_chunk_id'>): boolean {
  return item.grammar_chunk_id !== NULL_NUMBER;
}

function compareCurriculumPaths(left: CurriculumSortPath, right: CurriculumSortPath): number {
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

async function resetItems(items: UserItemLocal[], dateTime: string): Promise<number> {
  if (items.length === 0) return 0;

  return db.transaction('rw', db.user_items, async () => {
    const updatedItems = items.map((item) => {
      const updatedItem = { ...item };
      resetUserItem(updatedItem, dateTime);
      return updatedItem;
    });
    await db.user_items.bulkPut(updatedItems);
    return updatedItems.length;
  });
}
