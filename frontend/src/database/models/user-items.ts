import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { UserItemPractice, UserItemLocal, UserItemExport } from '@/types/user-item.types';
import { TableName } from '@/types/table.types';
import {
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveInteger,
} from '@/utils/assertions.utils';
import Dexie, { Entity } from 'dexie';
import { getSyncTimestamps, splitDeleted } from '../utils/data-sync.utils';

import {
  convertLocalToExport,
  convertAPIToLocal,
  addGrammarIndicatorFlag,
  getNextAt,
  resetUserItem,
} from '@/database/utils/user-items.utils';
import { infoHandler } from '@/features/logging/info-handler';
import { triggerLevelsUpdatedEvent } from '@/utils/dashboard.utils';
import { SupabaseError } from '@/types/error.types';
import Metadata from './metadata';
import UserScoreType from './user-scores';

const NULL_DATE = config.database.nullReplacementDate;
const NULL_NUMBER = config.database.nullReplacementNumber;

/**
 * Represents a user item entity in the application database.
 *
 * @method getPracticeDeck - Retrieves a practice deck of user items for studying.
 * @method savePracticeDeck - Saves practice deck items for a user, updating their progress and metadata.
 * @method getStartedVocabulary - Retrieves vocabulary items for a user that have been started (begun learning). Sorted by czech word.
 * @method resetItemById - Resets a user item to its default state by user and item ID.
 * @method deleteAllItems - Deletes all user items associated with a specific user.
 * @method syncFromRemote - Synchronizes user items from the remote server with the local database.
 */
export default class UserItem extends Entity<AppDB> implements UserItemLocal {
  item_id!: number;
  user_id!: string;
  czech!: string;
  english!: string;
  pronunciation!: string;
  audio!: string | null;
  is_study_item!: 0 | 1; // boolean represented as 0 or 1
  sort_order!: number;
  block_id!: number;
  grammar_id!: number;
  progress!: number;
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
  ): Promise<UserItemPractice[]> {
    assertNonEmptyString(userId, 'userId');
    assertPositiveInteger(deckSize, 'deckSize');

    // Step 1: Fetch already started grammar list
    const startedGrammarIdSet = new Set(await this.getStartedGrammarIds(userId));

    // Step 2: Fetch items with odd progress
    let deck = await this.getPracticeItemsByParity(userId, true, deckSize, false);

    // Step 3: If not enough items, fetch even progress items instead
    if (deck.length < deckSize) {
      let evenItems: UserItemLocal[] = [];
      evenItems = await this.getPracticeItemsByParity(userId, false, deckSize, false);

      const remainingLimit = deckSize - evenItems.length;
      if (remainingLimit > 0) {
        const remainingItems = await this.getPracticeItemsByParity(
          userId,
          false,
          remainingLimit,
          true,
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
    userId: string,
    items: UserItemPractice[],
    dateTime: string = new Date(Date.now()).toISOString(),
  ): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    if (!Array.isArray(items)) throw new Error('items must be an array.');
    if (!items || items.length === 0) return;

    const updatedItems = items.map((item) => {
      return {
        ...item,
        next_at: getNextAt(item.progress),
        started_at: item.started_at === NULL_DATE ? dateTime : item.started_at,
        updated_at: dateTime,
        mastered_at:
          item.mastered_at === NULL_DATE && item.progress >= config.srs.intervals.length
            ? dateTime
            : item.mastered_at,
      };
    });

    await db.user_items.bulkPut(updatedItems);
    await UserScoreType.addItemCount(userId, updatedItems.length, dateTime);
  }

  /**
   * Retrieves a list of unique grammar IDs for items that have been started by a user.
   * @param userId - The ID of the user
   */
  static async getByBlockId(userId: string, blockId: number): Promise<UserItemLocal[]> {
    assertNonEmptyString(userId, 'userId');
    assertPositiveInteger(blockId, 'blockId');

    const blockItems = await db.user_items
      .where('[user_id+block_id]')
      .equals([userId, blockId])
      .toArray();

    return blockItems.sort((a, b) => a.sort_order - b.sort_order);
  }

  /**
   * Retrieves a list of unique grammar IDs for items that have been started by a user.
   * @param userId - The ID of the user
   */
  static async getStartedGrammarIds(userId: string): Promise<number[]> {
    assertNonEmptyString(userId, 'userId');

    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter((item) => item.grammar_id !== NULL_NUMBER)
      .toArray();

    return [...new Set(startedItems.map((item) => item.grammar_id))];
  }

  /**
   * Retrieves a list of unique block IDs for items that have been started by a user or not intended as study items.
   * @param userId - The ID of the user
   */
  static async getOverviewBlocksIds(userId: string): Promise<number[]> {
    assertNonEmptyString(userId, 'userId');

    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .filter((item) => item.block_id !== NULL_NUMBER || item.is_study_item === 0)
      .toArray();

    return [...new Set(startedItems.map((item) => item.block_id))];
  }

  /**
   * Retrieves vocabulary items for a user that have been started (begun learning). Sorted by english word.
   * @param userId - The unique identifier of the user
   */
  static async getStartedVocabulary(userId: string): Promise<UserItemLocal[]> {
    assertNonEmptyString(userId, 'userId');

    const result = await db.user_items
      .where('[user_id+grammar_id+started_at+is_study_item]')
      .between(
        [userId, NULL_NUMBER, Dexie.minKey, 1],
        [userId, NULL_NUMBER, NULL_DATE, 1],
        true,
        false,
      )
      .toArray();

    result.sort((a, b) => a.english.toLowerCase().localeCompare(b.english.toLowerCase()));
    return result;
  }

  /**
   * Resets a user item to its default state by user and item ID.
   * @param userId - The unique identifier of the user
   * @param itemId - The unique identifier of the item to reset
   */
  static async resetItemById(userId: string, itemId: number): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    assertNonNegativeInteger(itemId, 'itemId');

    const count = await db.user_items
      .where('[user_id+item_id]')
      .equals([userId, itemId])
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    if (count === 0) {
      throw new Error(`No user items found for item ID ${itemId}.`);
    }

    infoHandler(`Resetted user item with itemId: ${itemId} for userId: ${userId}`);
    triggerLevelsUpdatedEvent(userId);
  }

  /**
   * Resets all user items associated with a specific grammar ID to their default state for a given user.
   * @param userId - The unique identifier of the user
   * @param grammarId - The unique identifier of the grammar
   */
  static async resetItemsByGrammarId(userId: string, grammarId: number): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    assertNonNegativeInteger(grammarId, 'grammarId');

    const count = await db.user_items
      .where('[user_id+grammar_id+started_at]')
      .between([userId, grammarId, Dexie.minKey], [userId, grammarId, NULL_DATE], true, false)
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    if (count === 0) {
      throw new Error(`No user items found for grammar ID ${grammarId}.`);
    }

    infoHandler(`Resetted ${count} user-items with grammarId: ${grammarId} for userId: ${userId}`);
    triggerLevelsUpdatedEvent(userId);
  }

  /**
   * Deletes all user items associated with a specific user.
   * Use only for deletion of user account, when user-items on remote are deleted automatically.
   * @param userId - The unique identifier of the user
   */
  static async deleteAllByUserId(userId: string): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    await db.user_items.where('user_id').equals(userId).delete();
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
   */
  static async syncFromRemote(userId: string, doFullSync: boolean): Promise<void> {
    assertNonEmptyString(userId, 'userId');

    // Step 1: Get the last synced timestamp for user scores
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.UserItems,
      userId,
    );

    // Step 2: Push local changes and pull updates in a single RPC call
    const localItems = await this.getUserItemsForSync(userId, lastSyncedAt, newSyncedAt);
    const updatedItems = await this.syncWithRemote(userId, localItems, lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedItems);

    // Step 4: Update local database with fetched items and update sync metadata
    await db.transaction('rw', db.user_items, db.metadata, async () => {
      if (doFullSync) {
        await this.deleteAllByUserId(userId);
      } else if (toDelete.length > 0) {
        await db.user_items.bulkDelete(toDelete.map((item) => [item.user_id, item.item_id]));
      }
      if (toUpsert.length > 0) {
        await db.user_items.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.UserItems, newSyncedAt, userId);
    });

    infoHandler(
      `Completed ${updatedItems.length} user items pull from remote for userId: ${userId}`,
    );
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

    if (localUserItems.length === 0) {
      infoHandler(`No user items to push for userId: ${userId}`);
      return [];
    }

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

    if (items.length > 0) {
      infoHandler(`Completed ${items.length} user items push to Supabase for userId: ${userId}`);
    }

    return (updatedUserItems ?? []).map(convertAPIToLocal);
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
  ): Promise<UserItemLocal[]> {
    const minNextAt = isNew ? NULL_DATE : Dexie.minKey;
    const maxNextAt = isNew ? NULL_DATE : new Date().toISOString();
    return db.user_items
      .where('[user_id+next_at+mastered_at+sort_order+is_study_item]')
      .between(
        [userId, minNextAt, NULL_DATE, Dexie.minKey, 1],
        [userId, maxNextAt, NULL_DATE, Dexie.maxKey, 1],
        true,
        false,
      )
      .filter((item) => (item.progress % 2 === 1) === isOdd)
      .limit(limit)
      .toArray();
  }
}
