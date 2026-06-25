import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type {
  UserItemPractice,
  UserItemLocal,
  ProgressHistoryEntry,
  ReviewPracticeMode,
} from '@/types/user-item.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { getSyncTimestamps, splitDeleted } from '../utils/sync-generic.utils';

import {
  addGrammarIndicatorFlag,
  getNextAt,
  resetUserItem,
} from '@/database/utils/user-items.utils';
import { triggerLevelsUpdatedEvent } from '@/utils/dashboard.utils';
import { SupabaseError } from '@/types/error.types';
import Metadata from './metadata';
import { reportInfo } from '@/features/logging/monitoring-handler';

const NULL_DATE = config.database.nullReplacementDate;
const NULL_NUMBER = config.database.nullReplacementNumber;
const SIM_PROGRESS = config.progress.simulationProgress;
const SIM_COUNT = config.progress.simulationCount;

type UserItemAPI = Omit<
  UserItemLocal,
  | 'is_vocabulary'
  | 'block_id'
  | 'grammar_id'
  | 'started_at'
  | 'deleted_at'
  | 'next_at'
  | 'mastered_at'
> & {
  is_vocabulary: boolean;
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
    started_at: apiItem.started_at ?? NULL_DATE,
    next_at: apiItem.next_at ?? NULL_DATE,
    mastered_at: apiItem.mastered_at ?? NULL_DATE,
    deleted_at: apiItem.deleted_at ?? NULL_DATE,
    block_id: apiItem.block_id ?? NULL_NUMBER,
    grammar_id: apiItem.grammar_id ?? NULL_NUMBER,
  };
}

/**
 * Represents a user item entity in the application database.
 *
 * @method getPracticeDeck - Retrieves a practice deck of user items for studying.
 * @method savePracticeDeck - Saves practice deck items for a user, updating their progress and metadata.
 * @method getAll - Retrieves a list of all user items.
 * @method getByUserId - Retrieves user items for a specific user. Sorted by sort_order.
 * @method getByBlockId - Retrieves user items for a specific user and block ID. Sorted by sort_order.
 * @method getStartedGrammarIds - Retrieves a list of unique grammar IDs for items that have been started by a user.
 * @method getStartedBlocksIds - Retrieves a list of unique block IDs for items that have been started by a user.
 * @method getStartedVocabulary - Retrieves vocabulary items for a user that have been started (begun learning). Sorted by czech word.
 * @method resetItemById - Resets a user item to its default state by user and item ID.
 * @method resetItemsByGrammarId - Resets all user items associated with a specific grammar ID to their default state for a given user.
 * @method resetItemsByBlockId - Resets all user items associated with a specific block ID to their default state for a given user.
 * @method simulateData - Adds progress to first 100 user_items.
 * @method deleteByUserId - Deletes all user items associated with a specific user.
 * @method syncFromRemote - Synchronizes user items from the remote server with the local database.
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
   * Retrieves a practice deck of user items for studying.
   * @param userId - The unique identifier of the user
   * @param deckSize - The maximum number of items to return (defaults to config.lesson.deckSize)
   */
  static async getPracticeDeck(
    userId: string,
    deckSize: number = config.lesson.deckSize,
    mode: ReviewPracticeMode = 'vocabulary',
  ): Promise<UserItemPractice[]> {
    // Step 1: Fetch already started grammar list
    const startedGrammarIdSet = new Set(await this.getStartedGrammarIds(userId));

    // Step 2: Fetch items with odd progress
    let deck = await this.getPracticeItemsByParity(userId, true, deckSize, false, mode);

    // Step 3: If not enough items, fetch even progress items instead
    if (deck.length < deckSize) {
      let evenItems: UserItemLocal[] = [];
      evenItems = await this.getPracticeItemsByParity(userId, false, deckSize, false, mode);

      const remainingLimit = deckSize - evenItems.length;
      if (remainingLimit > 0 && mode === 'vocabulary') {
        const remainingItems = await this.getPracticeItemsByParity(
          userId,
          false,
          remainingLimit,
          true,
          mode,
        );
        evenItems = [...evenItems, ...remainingItems];
      }

      if (evenItems.length >= deckSize) {
        deck = [...evenItems];
      } else {
        deck = [...deck, ...evenItems];
      }
    }

    return addGrammarIndicatorFlag(deck, startedGrammarIdSet);
  }

  /**
   * Saves practice deck items for a user, updating their progress and metadata.
   * @param userId - The unique identifier of the user
   * @param items - Array of user item records to be saved
   * @param dateTime - The date for which the progress is being saved (defaults to today)
   */
  static async savePracticeDeck(
    items: UserItemPractice[],
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const updatedItems = items.map((item) => this.formatSavedItem(item, dateTime));

    await db.user_items.bulkPut(updatedItems);
  }

  /**
   * Retrieves a list of all user items.
   */
  static async getAll(): Promise<UserItemLocal[]> {
    return await db.user_items.toCollection().toArray();
  }

  /**
   * Retrieves user items for a specific user. Sorted by sort_order.
   * @param userId - The unique identifier of the user
   */
  static async getByUserId(userId: string): Promise<UserItemLocal[]> {
    return await db.user_items.where('user_id').equals(userId).toArray();
  }

  /**
   * Retrieves a list of unique grammar IDs for items that have been started by a user.
   * @param userId - The ID of the user
   */
  static async getByBlockId(userId: string, blockId: number): Promise<UserItemLocal[]> {
    const blockItems = await db.user_items
      .where('[user_id+block_id]')
      .equals([userId, blockId])
      .toArray();

    return blockItems.sort((a, b) => a.sort_order - b.sort_order);
  }

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

  static async areAllVocabularyItemsStartedForLesson(
    userId: string,
    lessonId: number,
  ): Promise<boolean> {
    const vocabularyItems = await db.user_items
      .where('[user_id+lesson_id+is_vocabulary+started_at]')
      .between(
        [userId, lessonId, 1, Dexie.minKey],
        [userId, lessonId, 1, Dexie.maxKey],
        true,
        true,
      )
      .toArray();

    return vocabularyItems.length > 0 && vocabularyItems.every((item) => item.started_at !== NULL_DATE);
  }

  /**
   * Retrieves a list of unique grammar IDs for items that have been started by a user.
   * @param userId - The ID of the user
   */
  static async getStartedGrammarIds(userId: string): Promise<number[]> {
    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter((item) => item.grammar_id !== NULL_NUMBER)
      .toArray();

    return [...new Set(startedItems.map((item) => item.grammar_id))];
  }

  /**
   * Retrieves a list of unique block IDs for items that have been started by a user.
   * @param userId - The ID of the user
   */
  static async getStartedBlocksIds(userId: string): Promise<number[]> {
    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter((item) => item.block_id !== NULL_NUMBER)
      .toArray();

    return [...new Set(startedItems.map((item) => item.block_id))];
  }

  /**
   * Retrieves vocabulary items for a user that have been started (begun learning).
   * @param userId - The unique identifier of the user
   */
  static async getStartedVocabulary(userId: string): Promise<UserItemLocal[]> {
    const result = await db.user_items
      .where('[user_id+is_vocabulary+started_at]')
      .between([userId, 1, Dexie.minKey], [userId, 1, NULL_DATE], true, false)
      .toArray();
    return result;
  }

  /**
   * Resets a user item to its default state by user and item ID.
   * @param userId - The unique identifier of the user
   * @param itemId - The unique identifier of the item to reset
   * @return The ID of the reset item
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
   * Resets all user items associated with a specific grammar ID to their default state for a given user.
   * @param userId - The unique identifier of the user
   * @param grammarId - The unique identifier of the grammar
   * @return The count of reset items
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
   * Resets all user items associated with a specific block ID to their default state for a given user.
   * @param userId - The unique identifier of the user
   * @param blockId - The unique identifier of the block
   * @return The count of reset items
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
   * Deletes all user items associated with a specific user.
   * Use only for deletion of user account, when user-items on remote are deleted automatically.
   * @param userId - The unique identifier of the user
   * @return True if deletion was successful
   */
  static async deleteByUserId(userId: string): Promise<boolean> {
    await db.user_items.where('user_id').equals(userId).delete();
    return true;
  }

  /**
   * Update first {SIM_COUNT} user_items for a user to simulate progress for testing purposes.
   * Progress is set to {SIM_PROGRESS} and next_at is updated accordingly.
   * @param userId - The unique identifier of the user
   * @returns The count of updated items
   */
  static async simulateData(userId: string): Promise<number> {
    const dateTime = new Date().toISOString();

    const count = await db.user_items
      .where('[user_id+item_id]')
      .between([userId, 1], [userId, SIM_COUNT])
      .modify((item) => {
        const updated = this.formatSavedItem(item, dateTime, SIM_PROGRESS);
        Object.assign(item, updated);
      });

    return count;
  }

  /**
   * Synchronizes user items with the remote database.
   *
   * Performs a bidirectional sync by:
   * 1. Retrieving the last sync timestamp for the user
   * 2. Getting local user items that have been updated since the last sync timestamp
   * 3. Pushing local changes to the remote database
   * 4. Fetching updated items from the remote database
   * 5. Updating the local database with fetched items and sync metadata
   *
   * @param userId - The ID of the user whose items should be synced
   * @param doFullSync - If true, performs a full sync by deleting all local items before upserting remote items.
   *                     If false, performs an incremental sync by only deleting items marked as deleted remotely.
   * @returns The count of items that were updated from the remote database
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
   * Retrieves user items that have been updated within a specified time range for synchronization.
   * @param userId - The ID of the user whose items should be retrieved.
   * @param lastSyncedAt - The timestamp of the last synchronization (inclusive).
   * @param newSyncedAt - The timestamp of the new synchronization point (exclusive).
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
   * Pushes local user items to Supabase for synchronization.
   * @param items - An array of user items in SQL format to be pushed to the remote server.
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

  /**
   * Fetches practice items by odd/even progress parity for a user.
   * @param userId - The unique identifier of the user
   * @param isOdd - Whether to fetch items with odd progress
   * @param limit - Maximum number of items to fetch
   * @param isNew - Whether to fetch non-started items (next_at = NULL_DATE) or ready to practice items (next_at < today)
   */
  private static async getPracticeItemsByParity(
    userId: string,
    isOdd: boolean,
    limit: number,
    isNew: boolean = false,
    mode: ReviewPracticeMode = 'vocabulary',
  ): Promise<UserItemLocal[]> {
    const minNextAt = isNew ? NULL_DATE : Dexie.minKey;
    const maxNextAt = isNew ? NULL_DATE : new Date().toISOString();
    const isVocabulary = mode === 'vocabulary' ? 1 : 0;
    return db.user_items
      .where('[user_id+is_vocabulary+next_at+mastered_at+sort_order]')
      .between(
        [userId, isVocabulary, minNextAt, NULL_DATE, Dexie.minKey],
        [userId, isVocabulary, maxNextAt, NULL_DATE, Dexie.maxKey],
        true,
        false,
      )
      .filter((item) => item.mastered_at === NULL_DATE && (item.progress % 2 === 1) === isOdd)
      .limit(limit)
      .toArray();
  }

  /**
   * Formats a saved item with the provided dateTime.
   * @param item - The item to format
   * @param dateTime - The dateTime to use for formatting
   * @returns The formatted item
   */
  private static formatSavedItem(
    item: UserItemPractice | UserItemLocal,
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
