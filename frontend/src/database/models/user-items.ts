import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type {
  UserItemLocal,
  ProgressHistoryEntry,
  ReviewPracticeMode,
  CurriculumSortPath,
} from '@/types/user-item.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { getSyncTimestamps, splitDeleted } from '../utils/sync-generic.utils';

import { getNextAt, resetUserItem } from '@/database/utils/user-items.utils';
import { triggerLevelsUpdatedEvent } from '@/utils/dashboard.utils';
import { SupabaseError } from '@/types/error.types';
import type { ReadyPracticeState } from '@/types/generic.types';
import Metadata from './metadata';
import { reportInfo } from '@/features/logging/monitoring-handler';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { groupReadyPracticeSchedule } from '../utils/ready-practice.utils';

const NULL_DATE = config.database.nullReplacementDate;
const NULL_NUMBER = config.database.nullReplacementNumber;
const SIM_PROGRESS = config.progress.simulationProgress;
const SIM_COUNT = config.progress.simulationCount;

type UserItemAPI = Omit<
  UserItemLocal,
  | 'is_vocabulary'
  | 'is_practice_item'
  | 'block_id'
  | 'grammar_id'
  | 'started_at'
  | 'deleted_at'
  | 'next_at'
  | 'mastered_at'
> & {
  is_vocabulary: boolean;
  is_practice_item?: boolean;
  block_id: number | null;
  grammar_id: number | null;
  started_at: string | null;
  deleted_at: string | null;
  next_at: string | null;
  mastered_at: string | null;
};

type UserItemExport = Pick<
  UserItemAPI,
  | 'user_id'
  | 'item_id'
  | 'progress'
  | 'progress_history'
  | 'started_at'
  | 'updated_at'
  | 'next_at'
  | 'mastered_at'
>;

function convertLocalToExport(localItem: UserItemLocal): UserItemExport {
  const { user_id, item_id, progress, updated_at, started_at, next_at, mastered_at } = localItem;
  return {
    user_id,
    item_id,
    progress_history: localItem.progress_history ?? [],
    progress,
    updated_at,
    started_at: started_at === NULL_DATE ? null : started_at,
    next_at: next_at === NULL_DATE ? null : next_at,
    mastered_at: mastered_at === NULL_DATE ? null : mastered_at,
  };
}

function convertAPIToLocal(apiItem: UserItemAPI): UserItemLocal {
  return {
    ...apiItem,
    is_vocabulary: apiItem.is_vocabulary ? 1 : 0,
    is_practice_item: apiItem.is_practice_item === true ? 1 : 0,
    started_at: apiItem.started_at ?? NULL_DATE,
    next_at: apiItem.next_at ?? NULL_DATE,
    mastered_at: apiItem.mastered_at ?? NULL_DATE,
    deleted_at: apiItem.deleted_at ?? NULL_DATE,
    block_id: apiItem.block_id ?? NULL_NUMBER,
    grammar_id: apiItem.grammar_id ?? NULL_NUMBER,
  };
}

/**
 * Local Dexie model and sync API for user-specific vocabulary and grammar item progress.
 *
 * Public API:
 * - Practice flow: `getPracticeDeck`, `savePracticeDeck`, and `getReadyVocabularyPracticeState`.
 * - Progress lookups: `getStartedGrammarIds`, `getStartedBlocksIds`, and `getStartedVocabulary`.
 * - Grammar/block workflows: `saveNewGrammarBlockCompletion` and lesson-start checks.
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
  is_practice_item!: 0 | 1; // boolean represented as 0 or 1
  sort_order!: number;
  curriculum_sort_path!: CurriculumSortPath;
  note_id!: number;
  block_id!: number;
  grammar_id!: number;
  progress!: number;
  progress_history!: ProgressHistoryEntry[];
  started_at!: string;
  updated_at!: string;
  deleted_at!: string;
  next_at!: string;
  mastered_at!: string;
  lesson_id!: number;

  /**
   * Builds a practice deck for review or new vocabulary.
   *
   * @param userId User id whose practice items should be selected.
   * @param deckSize Maximum deck size; defaults to config.lesson.deckSize.
   * @param mode Review mode to select vocabulary items or grammar items. Defaults to vocabulary.
   * @returns Practice items ordered by readiness and curriculum position.
   */
  static async getPracticeDeck(
    userId: string,
    deckSize: number = config.lesson.deckSize,
    mode: ReviewPracticeMode = 'vocabulary',
  ): Promise<UserItemLocal[]> {
    if (deckSize <= 0) return [];

    const now = new Date().toISOString();
    const masteredGrammarBlockIdSet =
      mode === 'grammar' ? new Set(await this.getMasteredGrammarBlockIds(userId)) : null;

    const oddItems = await this.getDuePracticeItems(
      userId,
      true,
      deckSize,
      now,
      mode,
      masteredGrammarBlockIdSet,
    );
    if (oddItems.length === deckSize) return oddItems;

    let alternativeDeck = await this.getDuePracticeItems(
      userId,
      false,
      deckSize,
      now,
      mode,
      masteredGrammarBlockIdSet,
    );

    if (alternativeDeck.length < deckSize && mode === 'vocabulary') {
      const newItems = await this.getNewVocabularyPracticeItems(
        userId,
        deckSize - alternativeDeck.length,
      );
      alternativeDeck = [...alternativeDeck, ...newItems];
    }

    return alternativeDeck.length > 0 ? alternativeDeck : oddItems;
  }

  /**
   * Persists practice progress for all items in a completed deck.
   *
   * @param items Practice items to save. Empty or nullish arrays are ignored.
   * @param dateTime ISO timestamp used for started_at, updated_at, and mastered_at transitions.
   * Defaults to now.
   */
  static async savePracticeDeck(
    items: UserItemLocal[],
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const updatedItems = items.map((item) => this.formatSavedItem(item, dateTime));

    await db.user_items.bulkPut(updatedItems);
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
    return (await db.user_items.where('user_id').equals(userId).toArray()).filter(
      isPracticeItem,
    );
  }

  /**
   * Reads mastered non-vocabulary practice block ids for a user.
   *
   * @param userId User id whose grammar blocks should be inspected.
   * @returns Mastered grammar block ids.
   */
  static async getMasteredGrammarBlockIds(userId: string): Promise<number[]> {
    return (await db.user_blocks.where('user_id').equals(userId).toArray())
      .filter(
        (block) =>
          block.is_vocabulary === false &&
          block.mastered_at !== NULL_DATE,
      )
      .map((block) => block.block_id);
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

  /**
   * Marks all items in a newly completed grammar block as started.
   *
   * @param userId User id whose block items should be updated.
   * @param blockId Block id whose items should receive grammar-completion progress.
   * @param dateTime ISO timestamp used for started_at and updated_at. Defaults to now.
   * @returns Updated items that were written to IndexedDB; [] when the block has no items.
   */
  static async saveNewGrammarBlockCompletion(
    userId: string,
    blockId: number,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<UserItemLocal[]> {
    const blockItems = await this.getByBlockId(userId, blockId);
    const updatedItems = blockItems.map((item) => {
      const progress = Math.max(item.progress, config.progress.afterNewGrammarProgress);

      return {
        ...item,
        progress,
        progress_history: item.progress_history ?? [],
        started_at: item.started_at === NULL_DATE ? dateTime : item.started_at,
        updated_at: dateTime,
        next_at: getNextAt(progress),
        mastered_at: item.mastered_at,
      };
    });

    if (updatedItems.length > 0) {
      await db.user_items.bulkPut(updatedItems);
    }

    triggerLevelsUpdatedEvent(userId);
    return updatedItems;
  }

  /**
   * Checks whether all vocabulary practice items in a lesson have been started.
   *
   * @param userId User id whose lesson items should be checked.
   * @param lessonId Lesson id to inspect.
   * @returns true only when the lesson has vocabulary practice items and every one has started_at set.
   */
  static async areAllVocabularyItemsStartedForLesson(
    userId: string,
    lessonId: number,
  ): Promise<boolean> {
    const vocabularyItems = await db.user_items
      .where('[user_id+lesson_id+is_practice_item+is_vocabulary+started_at]')
      .between(
        [userId, lessonId, 1, 1, Dexie.minKey],
        [userId, lessonId, 1, 1, Dexie.maxKey],
        true,
        true,
      )
      .toArray();

    return vocabularyItems.length > 0 && vocabularyItems.every((item) => item.started_at !== NULL_DATE);
  }

  /**
   * Reads unique grammar ids from started practice items.
   *
   * @param userId User id whose started items should be inspected.
   * @returns Unique non-null-replacement grammar ids.
   */
  static async getStartedGrammarIds(userId: string): Promise<number[]> {
    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter((item) => isPracticeItem(item) && item.grammar_id !== NULL_NUMBER)
      .toArray();

    return [...new Set(startedItems.map((item) => item.grammar_id))];
  }

  /**
   * Reads unique block ids from started practice items.
   *
   * @param userId User id whose started items should be inspected.
   * @returns Unique non-null-replacement block ids.
   */
  static async getStartedBlocksIds(userId: string): Promise<number[]> {
    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter((item) => isPracticeItem(item) && item.block_id !== NULL_NUMBER)
      .toArray();

    return [...new Set(startedItems.map((item) => item.block_id))];
  }

  /**
   * Reads started vocabulary practice items for a user.
   *
   * @param userId User id whose vocabulary items should be read.
   * @returns Vocabulary practice items with started_at earlier than the null replacement date.
   */
  static async getStartedVocabulary(userId: string): Promise<UserItemLocal[]> {
    const result = await db.user_items
      .where('[user_id+is_practice_item+is_vocabulary+started_at]')
      .between([userId, 1, 1, Dexie.minKey], [userId, 1, 1, NULL_DATE], true, false)
      .toArray();
    return result;
  }

  /**
   * Calculates the ready vocabulary review badge state.
   *
   * @param userId Non-empty user id whose vocabulary items should be inspected.
   * @returns Ready count and future schedule. When ready count exceeds the badge cap, returns
   * badgeCap + 1 and an empty schedule to indicate overflow.
   * @throws Error when userId is empty.
   */
  static async getReadyVocabularyPracticeState(userId: string): Promise<ReadyPracticeState> {
    assertNonEmptyString(userId, 'userId');

    const badgeCap = config.practice.readyPracticeBadgeCap;
    const overflowLimit = badgeCap + 1;
    const nowIso = new Date(Date.now()).toISOString();

    const readyStartedItems = await db.user_items
      .where('[user_id+is_practice_item+is_vocabulary+next_at+mastered_at+sort_order]')
      .between(
        [userId, 1, 1, Dexie.minKey, NULL_DATE, Dexie.minKey],
        [userId, 1, 1, nowIso, NULL_DATE, Dexie.maxKey],
        true,
        false,
      )
      .filter((item) => item.mastered_at === NULL_DATE)
      .limit(overflowLimit)
      .toArray();

    if (readyStartedItems.length > badgeCap) {
      return { readyCount: overflowLimit, schedule: [] };
    }

    const notStartedLimit = overflowLimit - readyStartedItems.length;
    const notStartedItems = await db.user_items
      .where('[user_id+is_practice_item+is_vocabulary+next_at+mastered_at+sort_order]')
      .between(
        [userId, 1, 1, NULL_DATE, NULL_DATE, Dexie.minKey],
        [userId, 1, 1, NULL_DATE, NULL_DATE, Dexie.maxKey],
        true,
        true,
      )
      .filter((item) => item.mastered_at === NULL_DATE)
      .limit(notStartedLimit)
      .toArray();

    const readyCount = readyStartedItems.length + notStartedItems.length;
    if (readyCount > badgeCap) {
      return { readyCount: overflowLimit, schedule: [] };
    }

    if (readyCount > 0) {
      return { readyCount, schedule: [] };
    }

    const futureItems = await db.user_items
      .where('[user_id+is_practice_item+is_vocabulary+next_at+mastered_at+sort_order]')
      .between(
        [userId, 1, 1, nowIso, NULL_DATE, Dexie.minKey],
        [userId, 1, 1, NULL_DATE, NULL_DATE, Dexie.maxKey],
        false,
        false,
      )
      .filter((item) => item.mastered_at === NULL_DATE)
      .toArray();

    return {
      readyCount: 0,
      schedule: groupReadyPracticeSchedule(futureItems.map((item) => item.next_at)),
    };
  }

  /**
   * Resets one user item to its unstarted state.
   *
   * @param userId User id owning the item.
   * @param itemId Item id to reset.
   * @returns The reset item id.
   * @throws Error when no matching user item exists.
   */
  static async resetItemById(userId: string, itemId: number): Promise<number> {
    const count = await db.user_items
      .where('[user_id+item_id]')
      .equals([userId, itemId])
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    if (count === 0) {
      throw new Error(`No user items found for item ID ${itemId}.`);
    }

    triggerLevelsUpdatedEvent(userId);
    return itemId;
  }

  /**
   * Resets started user items for one grammar topic.
   *
   * @param userId User id owning the items.
   * @param grammarId Grammar id whose started items should be reset.
   * @returns Number of modified rows.
   */
  static async resetItemsByGrammarId(userId: string, grammarId: number): Promise<number> {
    const count = await db.user_items
      .where('[user_id+grammar_id+started_at]')
      .between([userId, grammarId, Dexie.minKey], [userId, grammarId, NULL_DATE], true, false)
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    triggerLevelsUpdatedEvent(userId);
    return count;
  }

  /**
   * Resets all user items in one block.
   *
   * @param userId User id owning the items.
   * @param blockId Block id whose items should be reset.
   * @returns Number of modified rows.
   */
  static async resetItemsByBlockId(userId: string, blockId: number): Promise<number> {
    const count = await db.user_items
      .where('[user_id+block_id]')
      .equals([userId, blockId])
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    triggerLevelsUpdatedEvent(userId);
    return count;
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

  /**
   * Applies simulated progress to the first configured range of user items.
   *
   * @param userId User id whose local rows should be modified.
   * @param dateTime ISO timestamp used for the simulated save. Defaults to now.
   * @returns Number of modified rows.
   */
  static async simulateData(
    userId: string,
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<number> {
    const count = await db.user_items
      .where('[user_id+item_id]')
      .between([userId, 1], [userId, SIM_COUNT], true, true)
      .modify((item) => {
        const updated = this.formatSavedItem(item, dateTime, SIM_PROGRESS);
        Object.assign(item, updated);
      });

    return count;
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

  /** Reads due, unmastered practice items for one progress parity. */
  private static async getDuePracticeItems(
    userId: string,
    isOdd: boolean,
    limit: number,
    now: string,
    mode: ReviewPracticeMode,
    masteredGrammarBlockIdSet: Set<number> | null = null,
  ): Promise<UserItemLocal[]> {
    const isVocabulary = mode === 'vocabulary' ? 1 : 0;
    const matchesItem = (item: UserItemLocal) =>
      item.mastered_at === NULL_DATE &&
      item.next_at !== NULL_DATE &&
      item.next_at < now &&
      (item.progress % 2 === 1) === isOdd &&
      (mode !== 'grammar' || masteredGrammarBlockIdSet?.has(item.block_id) === true);

    return db.user_items
      .where(
        '[user_id+is_practice_item+is_vocabulary+next_at+mastered_at+curriculum_sort_path]',
      )
      .between(
        [userId, 1, isVocabulary, Dexie.minKey, NULL_DATE, Dexie.minKey],
        [userId, 1, isVocabulary, now, NULL_DATE, Dexie.maxKey],
        true,
        false,
      )
      .filter(matchesItem)
      .limit(limit)
      .toArray();
  }

  /** Reads never-scheduled vocabulary items in curriculum order. */
  private static async getNewVocabularyPracticeItems(
    userId: string,
    limit: number,
  ): Promise<UserItemLocal[]> {
    return db.user_items
      .where(
        '[user_id+is_practice_item+is_vocabulary+next_at+mastered_at+curriculum_sort_path]',
      )
      .between(
        [userId, 1, 1, NULL_DATE, NULL_DATE, Dexie.minKey],
        [userId, 1, 1, NULL_DATE, NULL_DATE, Dexie.maxKey],
        true,
        true,
      )
      .filter((item) => item.mastered_at === NULL_DATE && item.next_at === NULL_DATE)
      .limit(limit)
      .toArray();
  }

  /**
   * Applies practice progress fields to a user item copy.
   *
   * @param item Practice or local item to format.
   * @param dateTime ISO timestamp used for started_at, updated_at, and mastered_at transitions.
   * @param progressAddition Amount added to current progress; defaults to 0 for already incremented items.
   * @returns Item copy with next_at recalculated and mastered_at set when progress reaches the final SRS interval.
   */
  private static formatSavedItem(
    item: UserItemLocal,
    dateTime: string,
    progressAddition: number = 0,
  ): UserItemLocal {
    const newProgress = item.progress + progressAddition;

    return {
      ...item,
      progress: newProgress,
      next_at: getNextAt(newProgress),
      started_at: item.started_at === NULL_DATE ? dateTime : item.started_at,
      updated_at: dateTime,
      mastered_at:
        item.mastered_at === NULL_DATE && newProgress >= config.srs.intervals.length
          ? dateTime
          : item.mastered_at,
    };
  }
}

function isPracticeItem(item: Pick<UserItemLocal, 'is_practice_item'>): boolean {
  return item.is_practice_item !== 0;
}
