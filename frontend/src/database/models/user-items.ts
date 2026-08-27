import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type {
  PracticeDeckItem,
  PracticeDirection,
  PracticeOutcome,
  UserItemLocal,
  ProgressHistoryEntry,
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

const NULL_DATE = config.database.nullReplacementDate;
const NULL_NUMBER = config.database.nullReplacementNumber;
const SIM_ITEM_COUNT = config.progress.simulationItemCount;
const SIM_ITEM_PROGRESS = config.progress.simulationItemProgress;
const SIM_PRONUNCIATION_ITEM_COUNT = config.progress.simulationPronunciationItemCount;

type UserItemAPI = Omit<
  UserItemLocal,
  | 'is_vocabulary'
  | 'has_pronunciation_practice'
  | 'block_id'
  | 'topic_id'
  | 'grammar_chunk_id'
  | 'started_at'
  | 'deleted_at'
  | 'next_at_cz_to_en'
  | 'next_at_en_to_cz'
  | 'mastered_at_cz_to_en'
  | 'mastered_at_en_to_cz'
> & {
  is_vocabulary: boolean;
  has_pronunciation_practice?: boolean;
  block_id: number | null;
  topic_id: number | null;
  grammar_chunk_id: number | null;
  started_at: string | null;
  deleted_at: string | null;
  next_at_cz_to_en: string | null;
  next_at_en_to_cz: string | null;
  mastered_at_cz_to_en: string | null;
  mastered_at_en_to_cz: string | null;
};

type UserItemExport = Pick<
  UserItemAPI,
  | 'user_id'
  | 'item_id'
  | 'progress_cz_to_en'
  | 'progress_en_to_cz'
  | 'progress_history'
  | 'has_pronunciation_practice'
  | 'started_at'
  | 'updated_at'
  | 'next_at_cz_to_en'
  | 'next_at_en_to_cz'
  | 'mastered_at_cz_to_en'
  | 'mastered_at_en_to_cz'
>;

function convertLocalToExport(localItem: UserItemLocal): UserItemExport {
  const {
    user_id,
    item_id,
    progress_cz_to_en,
    progress_en_to_cz,
    updated_at,
    started_at,
    next_at_cz_to_en,
    next_at_en_to_cz,
    mastered_at_cz_to_en,
    mastered_at_en_to_cz,
    has_pronunciation_practice,
  } = localItem;
  return {
    user_id,
    item_id,
    progress_history: localItem.progress_history ?? [],
    progress_cz_to_en,
    progress_en_to_cz,
    has_pronunciation_practice: has_pronunciation_practice === 1,
    updated_at,
    started_at: started_at === NULL_DATE ? null : started_at,
    next_at_cz_to_en: next_at_cz_to_en === NULL_DATE ? null : next_at_cz_to_en,
    next_at_en_to_cz: next_at_en_to_cz === NULL_DATE ? null : next_at_en_to_cz,
    mastered_at_cz_to_en: mastered_at_cz_to_en === NULL_DATE ? null : mastered_at_cz_to_en,
    mastered_at_en_to_cz: mastered_at_en_to_cz === NULL_DATE ? null : mastered_at_en_to_cz,
  };
}

function convertAPIToLocal(apiItem: UserItemAPI): UserItemLocal {
  return {
    ...apiItem,
    is_vocabulary: apiItem.is_vocabulary ? 1 : 0,
    has_pronunciation_practice: apiItem.has_pronunciation_practice ? 1 : 0,
    started_at: apiItem.started_at ?? NULL_DATE,
    next_at_cz_to_en: apiItem.next_at_cz_to_en ?? NULL_DATE,
    next_at_en_to_cz: apiItem.next_at_en_to_cz ?? NULL_DATE,
    mastered_at_cz_to_en: apiItem.mastered_at_cz_to_en ?? NULL_DATE,
    mastered_at_en_to_cz: apiItem.mastered_at_en_to_cz ?? NULL_DATE,
    deleted_at: apiItem.deleted_at ?? NULL_DATE,
    block_id: apiItem.block_id ?? NULL_NUMBER,
    topic_id: apiItem.topic_id ?? NULL_NUMBER,
    grammar_chunk_id: apiItem.grammar_chunk_id ?? NULL_NUMBER,
  };
}

/**
 * Local Dexie model and sync API for user-specific vocabulary and grammar item progress.
 *
 * Public API:
 * - Review flow: `getReviewDeck`, `savePracticeDeck`, and `getReadyReviewState`.
 * - Progress lookups: `getStartedGrammarChunkIds`, topic items, and started vocabulary.
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
  has_pronunciation_practice!: 0 | 1;
  sort_order!: number;
  curriculum_sort_path!: CurriculumSortPath;
  note_id!: number;
  block_id!: number;
  topic_id!: number;
  grammar_chunk_id!: number;
  progress_cz_to_en!: number;
  progress_en_to_cz!: number;
  progress_history!: ProgressHistoryEntry[];
  started_at!: string;
  updated_at!: string;
  deleted_at!: string;
  next_at_cz_to_en!: string;
  next_at_en_to_cz!: string;
  mastered_at_cz_to_en!: string;
  mastered_at_en_to_cz!: string;
  lesson_id!: number;

  /**
   * Builds one unified vocabulary and grammar practice deck.
   *
   * @param userId User id whose practice items should be selected.
   * @param deckSize Maximum deck size; defaults to the review star size.
   * @returns Practice items ordered by readiness and curriculum position.
   */
  static async getReviewDeck(
    userId: string,
    deckSize: number = config.practice.reviewStarSize,
  ): Promise<PracticeDeckItem[]> {
    if (deckSize <= 0) return [];

    const now = new Date().toISOString();
    const czToEnItems = await this.getDuePracticeItems(userId, 'czToEn', deckSize, now);
    if (czToEnItems.length === deckSize) return czToEnItems;

    const enToCzItems = await this.getDuePracticeItems(userId, 'enToCz', deckSize, now);

    if (enToCzItems.length === deckSize) return enToCzItems;

    const alternativeDeck = await this.getDuePracticeItems(userId, 'czToEn', deckSize, now);

    if (alternativeDeck.length === deckSize) return alternativeDeck;
    return [];
  }

  /**
   * Persists practice progress for all items in a completed deck.
   *
   * Missing, deleted, or already-mastered items for the practiced direction are silently skipped.
   *
   * @param items Practice items with their practiced direction. Empty arrays are ignored.
   */
  static async savePracticeDeck(items: PracticeDeckItem[]): Promise<void> {
    if (!items || items.length === 0) return;

    await db.transaction('rw', db.user_items, async () => {
      const updates = [];

      for (const item of items) {
        const currentItem = await db.user_items.get([item.user_id, item.item_id]);
        if (currentItem?.deleted_at !== NULL_DATE) continue;
        if (getDirectionMasteredAt(currentItem, item.practice_direction) !== NULL_DATE) continue;

        updates.push({
          key: [item.user_id, item.item_id],
          changes: {
            progress_cz_to_en: item.progress_cz_to_en,
            progress_en_to_cz: item.progress_en_to_cz,
            progress_history: item.progress_history,
            started_at: item.started_at,
            updated_at: item.updated_at,
            next_at_cz_to_en: item.next_at_cz_to_en,
            next_at_en_to_cz: item.next_at_en_to_cz,
            mastered_at_cz_to_en: item.mastered_at_cz_to_en,
            mastered_at_en_to_cz: item.mastered_at_en_to_cz,
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

    const unstartedItems = (await db.user_items.where('user_id').equals(userId).toArray())
      .filter((item) => item.deleted_at === NULL_DATE && item.started_at === NULL_DATE)
      .sort((left, right) =>
        compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path),
      );
    const firstItem = unstartedItems[0];
    if (!firstItem) return null;

    if (firstItem.block_id !== NULL_NUMBER) {
      const block = await db.blocks.get(firstItem.block_id);
      if (!block) return null;
      return {
        blockId: firstItem.block_id,
        items: unstartedItems.filter((item) => item.block_id === firstItem.block_id),
      };
    }

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

  /**
   * Marks all items in a completed initial-training block as started.
   *
   * @param userId User id whose block items should be updated.
   * @param blockId Block id whose items should receive grammar-completion progress.
   * @param dateTime ISO timestamp used for started_at and updated_at. Defaults to now.
   * @returns Updated items that were written to IndexedDB; [] when the block has no items.
   */
  static async saveInitialTrainingCompletion(
    userId: string,
    itemIds: readonly number[],
    dateTime: string = new Date(Date.now()).toISOString(),
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
      const progressCzToEn = Math.max(
        item.progress_cz_to_en,
        config.progress.afterNewBlockProgress,
      );
      const progressEnToCz = Math.max(
        item.progress_en_to_cz,
        config.progress.afterNewBlockProgress,
      );

      return {
        ...item,
        progress_cz_to_en: progressCzToEn,
        progress_en_to_cz: progressEnToCz,
        progress_history: item.progress_history ?? [],
        started_at: item.started_at === NULL_DATE ? dateTime : item.started_at,
        updated_at: dateTime,
        next_at_cz_to_en: getNextAt(progressCzToEn, 'czToEn'),
        next_at_en_to_cz: getNextAt(progressEnToCz, 'enToCz'),
        mastered_at_cz_to_en: resolveMasteredAt(
          progressCzToEn,
          'czToEn',
          item.mastered_at_cz_to_en,
          dateTime,
        ),
        mastered_at_en_to_cz: resolveMasteredAt(
          progressEnToCz,
          'enToCz',
          item.mastered_at_en_to_cz,
          dateTime,
        ),
      };
    });

    if (updatedItems.length > 0) {
      await db.user_items.bulkPut(updatedItems);
    }

    return updatedItems;
  }

  /** Reads started items assigned to one topic, ordered by curriculum position. */
  static async getStartedByTopicId(userId: string, topicId: number): Promise<UserItemLocal[]> {
    const topicItems = await db.user_items
      .where('[user_id+topic_id]')
      .equals([userId, topicId])
      .filter((item) => item.started_at !== NULL_DATE)
      .toArray();

    return topicItems.sort((left, right) =>
      compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path),
    );
  }

  /**
   * Returns whether the user has at least one started grammar practice item.
   *
   * @param userId User id whose grammar availability should be checked.
   */
  static async hasStartedGrammar(userId: string): Promise<boolean> {
    const startedItem = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter(isStartedGrammarItem)
      .first();

    return startedItem !== undefined;
  }

  /**
   * Reads unique grammar ids from started practice items.
   *
   * @param userId User id whose started items should be inspected.
   * @returns Unique non-null-replacement grammar ids.
   */
  static async getStartedGrammarChunkIds(userId: string): Promise<number[]> {
    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter(isStartedGrammarItem)
      .toArray();

    return [...new Set(startedItems.map((item) => item.grammar_chunk_id))];
  }

  /**
   * Reads started vocabulary practice items for a user.
   *
   * @param userId User id whose vocabulary items should be read.
   * @returns Vocabulary practice items with started_at earlier than the null replacement date.
   */
  static async getStartedVocabulary(userId: string): Promise<UserItemLocal[]> {
    const result = await db.user_items
      .where('[user_id+is_vocabulary+started_at]')
      .between([userId, 1, Dexie.minKey], [userId, 1, NULL_DATE], true, false)
      .toArray();
    return result;
  }

  /**
   * Returns whether an item can be selected for pronunciation practice.
   */
  static isPronunciationEligible(item: Pick<UserItemLocal, 'audio'>): boolean {
    return Boolean(item.audio?.trim());
  }

  /**
   * Reads the persisted pronunciation selection for one user item.
   */
  static async getPronunciationSelection(userId: string, itemId: number): Promise<boolean> {
    const item = await db.user_items.get([userId, itemId]);
    return item?.has_pronunciation_practice === 1;
  }

  /**
   * Toggles one eligible item's pronunciation selection without changing progress.
   *
   * @returns The new selection, or null when the item is missing or deleted.
   */
  static async togglePronunciationPractice(
    userId: string,
    itemId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<boolean | null> {
    return db.transaction('rw', db.user_items, async () => {
      const item = await db.user_items.get([userId, itemId]);
      if (item?.deleted_at !== NULL_DATE) return null;
      if (!this.isPronunciationEligible(item)) {
        throw new Error(`Item ${itemId} is not eligible for pronunciation practice.`);
      }

      const enabled = item.has_pronunciation_practice !== 1;
      await db.user_items.update([userId, itemId], {
        has_pronunciation_practice: enabled ? 1 : 0,
        updated_at: dateTime,
      });
      return enabled;
    });
  }

  /**
   * Counts selected pronunciation items using only the dedicated compound index.
   */
  static async getPronunciationPracticeCount(userId: string): Promise<number> {
    return db.user_items.where('[user_id+has_pronunciation_practice]').equals([userId, 1]).count();
  }

  /**
   * Builds a stable snapshot of every selected, eligible pronunciation item.
   */
  static async getPronunciationPracticeDeck(userId: string): Promise<UserItemLocal[]> {
    const [items, memberships] = await Promise.all([
      db.user_items.where('[user_id+has_pronunciation_practice]').equals([userId, 1]).toArray(),
      db.pronunciation_group_items.toArray(),
    ]);
    const firstGroupByItem = new Map<number, number>();
    for (const membership of memberships) {
      const currentGroupId = firstGroupByItem.get(membership.item_id);
      if (currentGroupId === undefined || membership.pronunciation_group_id < currentGroupId) {
        firstGroupByItem.set(membership.item_id, membership.pronunciation_group_id);
      }
    }

    return items
      .filter((item) => this.isPronunciationEligible(item))
      .sort(
        (left, right) =>
          (firstGroupByItem.get(left.item_id) ?? Number.MAX_SAFE_INTEGER) -
            (firstGroupByItem.get(right.item_id) ?? Number.MAX_SAFE_INTEGER) ||
          compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path) ||
          left.item_id - right.item_id,
      );
  }

  /**
   * Calculates the ready vocabulary review badge state.
   *
   * @param userId Non-empty user id whose vocabulary items should be inspected.
   * @returns The earliest date when a complete review deck will be available.
   * @throws Error when userId is empty.
   */
  static async getReadyReviewState(userId: string): Promise<ReadyPracticeState> {
    assertNonEmptyString(userId, 'userId');

    const deckSize = config.practice.reviewStarSize;
    const nowIso = new Date(Date.now()).toISOString();

    const items = await db.user_items.where('user_id').equals(userId).toArray();
    const readyAtByDirection = DIRECTIONS.map((direction) =>
      getReviewReadyAt(items, direction, deckSize, nowIso),
    );

    return { reviewReadyAt: getEarliestReadyAt(readyAtByDirection) };
  }

  /**
   * Resets one user item to its unstarted state.
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
    const count = await db.user_items
      .where('[user_id+item_id]')
      .equals([userId, itemId])
      .modify((item: UserItemLocal) => {
        resetUserItem(item, dateTime);
      });

    if (count === 0) {
      throw new Error(`No user items found for item ID ${itemId}.`);
    }

    return itemId;
  }

  /**
   * Resets started user items for one grammar topic.
   *
   * @param userId User id owning the items.
   * @param grammarChunkId Grammar chunk id whose started items should be reset.
   * @returns Number of modified rows.
   */
  static async resetItemsByGrammarChunkId(
    userId: string,
    grammarChunkId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    const count = await db.user_items
      .where('[user_id+grammar_chunk_id+started_at]')
      .between(
        [userId, grammarChunkId, Dexie.minKey],
        [userId, grammarChunkId, NULL_DATE],
        true,
        false,
      )
      .modify((item: UserItemLocal) => {
        resetUserItem(item, dateTime);
      });

    return count;
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
    const count = await db.user_items
      .where('[user_id+block_id]')
      .equals([userId, blockId])
      .modify((item: UserItemLocal) => {
        resetUserItem(item, dateTime);
      });

    return count;
  }

  /** Resets all user items assigned to one topic. */
  static async resetItemsByTopicId(
    userId: string,
    topicId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    return db.user_items
      .where('[user_id+topic_id]')
      .equals([userId, topicId])
      .modify((item: UserItemLocal) => {
        resetUserItem(item, dateTime);
      });
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
    const pronunciationItemIds = new Set(
      items
        .filter((item) => Boolean(item.audio?.trim()))
        .slice(0, SIM_PRONUNCIATION_ITEM_COUNT)
        .map((item) => item.item_id),
    );
    const simulatedItems = items.map((item) => {
      let hasPronunciationPractice = item.has_pronunciation_practice;
      if (pronunciationItemIds.has(item.item_id)) hasPronunciationPractice = 1;

      return {
        ...item,
        progress_cz_to_en: SIM_ITEM_PROGRESS,
        progress_en_to_cz: SIM_ITEM_PROGRESS,
        progress_history: [
          {
            progress: SIM_ITEM_PROGRESS,
            created_at: dateTime,
            direction: 'czToEn' as const,
            outcome: 'correct' as const,
          },
          {
            progress: SIM_ITEM_PROGRESS,
            created_at: dateTime,
            direction: 'enToCz' as const,
            outcome: 'correct' as const,
          },
        ],
        has_pronunciation_practice: hasPronunciationPractice,
        started_at: dateTime,
        updated_at: dateTime,
        next_at_cz_to_en: dateTime,
        next_at_en_to_cz: dateTime,
        mastered_at_cz_to_en: NULL_DATE,
        mastered_at_en_to_cz: NULL_DATE,
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
    // Step 1: Get the last synced timestamp for user scores
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.UserItems,
      userId,
    );

    // Step 2: Push local changes and pull updates in a single RPC call
    const localItems = await this.getUserItemsForSync(userId, lastSyncedAt, newSyncedAt);
    reportInfo(`Completed ${localItems.length} UserItems push to remote`);

    const updatedItems = await this.syncWithRemote(userId, localItems, lastSyncedAt);
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
   * @param lastSyncedAt Inclusive lower updated_at bound.
   * @param newSyncedAt Exclusive upper updated_at bound.
   * @returns Item rows converted to the remote export shape.
   */
  private static async getUserItemsForSync(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserItemExport[]> {
    const localUserItems: UserItemLocal[] = await db.user_items
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    return localUserItems.map(convertLocalToExport);
  }

  /**
   * Calls the Supabase item sync RPC.
   *
   * @param userId User id passed to the RPC.
   * @param items Local item rows to upsert remotely before fetching remote changes.
   * @param lastSyncedAt Inclusive remote change lower bound.
   * @returns Remote item rows converted to local shape, or [] when none are returned.
   * @throws SupabaseError when the RPC fails.
   */
  private static async syncWithRemote(
    userId: string,
    items: UserItemExport[],
    lastSyncedAt: string,
  ): Promise<UserItemLocal[]> {
    const { data: updatedUserItems, error: rpcFetchError } = await supabaseInstance.rpc(
      'upsert_fetch_user_items',
      {
        p_user_id: userId,
        p_last_synced_at: lastSyncedAt,
        p_user_items: items,
      },
    );

    if (rpcFetchError) {
      throw new SupabaseError('Error fetching user_items with Supabase.', rpcFetchError, {
        itemCount: items.length,
        lastSyncedAt,
      });
    }

    if (!updatedUserItems || updatedUserItems.length === 0) return [];
    return updatedUserItems.map(convertAPIToLocal);
  }

  /** Reads due, unmastered practice items for one explicit direction. */
  private static async getDuePracticeItems(
    userId: string,
    direction: PracticeDirection,
    limit: number,
    now: string,
  ): Promise<PracticeDeckItem[]> {
    const matchesItem = (item: UserItemLocal) =>
      item.started_at !== NULL_DATE &&
      getDirectionMasteredAt(item, direction) === NULL_DATE &&
      getDirectionNextAt(item, direction) !== NULL_DATE &&
      getDirectionNextAt(item, direction) < now;

    const index =
      direction === 'czToEn'
        ? '[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]'
        : '[user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]';

    return db.user_items
      .where(index)
      .between(
        [userId, Dexie.minKey, NULL_DATE, Dexie.minKey],
        [userId, now, NULL_DATE, Dexie.maxKey],
        true,
        false,
      )
      .filter(matchesItem)
      .limit(limit)
      .toArray()
      .then((items) => items.map((item) => ({ ...item, practice_direction: direction })));
  }

  /**
   * Applies one explicit practice outcome to the active direction.
   *
   * The first answer schedules the opposite direction at zero progress without recording history.
   */
  static applyPracticeProgress(
    item: UserItemLocal,
    direction: PracticeDirection,
    outcome: PracticeOutcome,
    dateTime: string,
    options: { oppositeDirectionNextAt?: string } = {},
  ): UserItemLocal {
    const isFirstAnswer = item.started_at === NULL_DATE;
    const currentProgress = getDirectionProgress(item, direction);
    const otherDirection: PracticeDirection = direction === 'czToEn' ? 'enToCz' : 'czToEn';
    const changes: Partial<UserItemLocal> = {
      ...item,
      started_at: item.started_at === NULL_DATE ? dateTime : item.started_at,
      updated_at: dateTime,
    };

    if (isFirstAnswer) {
      initializeDirectionState(changes, otherDirection, options.oppositeDirectionNextAt);
    }

    let directionProgress = currentProgress;
    if (outcome === 'correct') {
      directionProgress += 1;
      setDirectionState(changes, item, direction, directionProgress, dateTime);
    } else if (outcome === 'incorrect') {
      directionProgress = 0;
      setDirectionState(changes, item, direction, directionProgress, dateTime);
      clearDirectionMastery(changes, direction);
    } else {
      setDirectionMastered(changes, direction, currentProgress, dateTime);
    }

    return {
      ...item,
      ...changes,
      progress_history: [
        ...(item.progress_history ?? []),
        { progress: directionProgress, created_at: dateTime, direction, outcome },
      ],
    };
  }
}

const DIRECTIONS: readonly PracticeDirection[] = ['czToEn', 'enToCz'];

function getReviewReadyAt(
  items: UserItemLocal[],
  direction: PracticeDirection,
  deckSize: number,
  nowIso: string,
): string | null {
  const futureDates: string[] = [];
  let readyCount = 0;

  for (const item of items) {
    if (item.started_at === NULL_DATE) continue;
    if (getDirectionMasteredAt(item, direction) !== NULL_DATE) continue;

    const nextAt = getDirectionNextAt(item, direction);
    if (nextAt === NULL_DATE) continue;
    if (nextAt <= nowIso) {
      readyCount += 1;
      continue;
    }
    if (Number.isFinite(Date.parse(nextAt))) futureDates.push(nextAt);
  }

  if (readyCount >= deckSize) return nowIso;

  futureDates.sort((left, right) => Date.parse(left) - Date.parse(right));
  const missingCount = deckSize - readyCount;
  return futureDates[missingCount - 1] ?? null;
}

function getEarliestReadyAt(readyDates: Array<string | null>): string | null {
  const validDates = readyDates.filter((date): date is string => date !== null);
  if (validDates.length === 0) return null;

  const [firstDate, ...remainingDates] = validDates;
  return remainingDates.reduce(
    (earliest, date) => (Date.parse(date) < Date.parse(earliest) ? date : earliest),
    firstDate,
  );
}

function getDirectionProgress(item: UserItemLocal, direction: PracticeDirection): number {
  return direction === 'czToEn' ? item.progress_cz_to_en : item.progress_en_to_cz;
}

function getDirectionNextAt(item: UserItemLocal, direction: PracticeDirection): string {
  return direction === 'czToEn' ? item.next_at_cz_to_en : item.next_at_en_to_cz;
}

function getDirectionMasteredAt(item: UserItemLocal, direction: PracticeDirection): string {
  return direction === 'czToEn' ? item.mastered_at_cz_to_en : item.mastered_at_en_to_cz;
}

function setDirectionState(
  target: Partial<UserItemLocal>,
  original: UserItemLocal,
  direction: PracticeDirection,
  progress: number,
  dateTime: string,
): void {
  const masteredAt = resolveMasteredAt(
    progress,
    direction,
    getDirectionMasteredAt(original, direction),
    dateTime,
  );

  if (direction === 'czToEn') {
    target.progress_cz_to_en = progress;
    target.next_at_cz_to_en = getNextAt(progress, direction);
    target.mastered_at_cz_to_en = masteredAt;
  } else {
    target.progress_en_to_cz = progress;
    target.next_at_en_to_cz = getNextAt(progress, direction);
    target.mastered_at_en_to_cz = masteredAt;
  }
}

function initializeDirectionState(
  target: Partial<UserItemLocal>,
  direction: PracticeDirection,
  nextAt: string | undefined,
): void {
  if (direction === 'czToEn') {
    target.progress_cz_to_en = 0;
    target.next_at_cz_to_en = nextAt ?? getNextAt(0, direction);
    target.mastered_at_cz_to_en = NULL_DATE;
  } else {
    target.progress_en_to_cz = 0;
    target.next_at_en_to_cz = nextAt ?? getNextAt(0, direction);
    target.mastered_at_en_to_cz = NULL_DATE;
  }
}

function setDirectionMastered(
  target: Partial<UserItemLocal>,
  direction: PracticeDirection,
  progress: number,
  dateTime: string,
): void {
  if (direction === 'czToEn') {
    target.progress_cz_to_en = progress;
    target.next_at_cz_to_en = NULL_DATE;
    target.mastered_at_cz_to_en = dateTime;
  } else {
    target.progress_en_to_cz = progress;
    target.next_at_en_to_cz = NULL_DATE;
    target.mastered_at_en_to_cz = dateTime;
  }
}

function clearDirectionMastery(target: Partial<UserItemLocal>, direction: PracticeDirection): void {
  if (direction === 'czToEn') {
    target.mastered_at_cz_to_en = NULL_DATE;
  } else {
    target.mastered_at_en_to_cz = NULL_DATE;
  }
}

function resolveMasteredAt(
  progress: number,
  direction: PracticeDirection,
  currentMasteredAt: string,
  dateTime: string,
): string {
  if (progress < config.srs.intervals[direction].length) return currentMasteredAt;
  if (currentMasteredAt !== NULL_DATE) return currentMasteredAt;
  return dateTime;
}

function isStartedGrammarItem(item: Pick<UserItemLocal, 'grammar_chunk_id'>): boolean {
  return item.grammar_chunk_id !== NULL_NUMBER;
}

function compareCurriculumPaths(left: CurriculumSortPath, right: CurriculumSortPath): number {
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}
