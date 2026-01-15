import Dexie, { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { TableName, type UserItemLocal, type UserItemPractice } from '@/types/local.types';
import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';

import { getNextAt, sortOddEvenByProgress } from '@/database/database.utils';
import {
  convertLocalToSQL,
  getTodayShortDate,
  getLocalDateFromUTC,
  triggerUserItemsUpdatedEvent,
  resetUserItem,
} from '@/database/database.utils';
import UserScore from './user-scores';
import Metadata from './metadata';
import Grammar from './grammar';

export default class UserItem extends Entity<AppDB> implements UserItemLocal {
  item_id!: number;
  user_id!: string;
  czech!: string;
  english!: string;
  pronunciation!: string;
  audio!: string | null;
  sequence!: number;
  grammar_id!: number;
  progress!: number;
  started_at!: string;
  updated_at!: string;
  deleted_at!: string | null;
  next_at!: string;
  mastered_at!: string;

  /**
   * Gets a practice deck of user items for the logged-in user.
   * @param userId the ID of the logged-in user.
   * @param deckSize number of items to include in the practice deck.
   * @returns array of UserItemLocal objects.
   * @throws error if operation fails.
   */
  static async getPracticeDeck(
    userId: string,
    deckSize: number = config.lesson.deckSize,
  ): Promise<UserItemPractice[]> {
    // Step 1: Fetch started grammar list
    const startedGrammar = await Grammar.getStartedGrammarList(userId);

    // Step 2: Fetch items with next_at older than now, sorted by next_at
    let itemsWithNextAt: UserItemLocal[] = await db.user_items
      .where('[user_id+next_at+mastered_at+sequence]')
      .between(
        [userId, '0000-01-01T00:00:00.000Z', Dexie.minKey, Dexie.minKey],
        [userId, new Date().toISOString(), Dexie.maxKey, Dexie.maxKey],
      )
      .limit(deckSize)
      .toArray();

    // Step 3: If not enough items, fetch additional items without next_at set
    const remainingLimit = deckSize - itemsWithNextAt.length;
    if (remainingLimit > 0) {
      const remainingItems = await db.user_items
        .where('[user_id+next_at+mastered_at+sequence]')
        .between(
          [
            userId,
            config.database.nullReplacementDate,
            config.database.nullReplacementDate,
            Dexie.minKey,
          ],
          [
            userId,
            config.database.nullReplacementDate,
            config.database.nullReplacementDate,
            Dexie.maxKey,
          ],
          true,
          false,
        )
        .limit(remainingLimit)
        .toArray();
      itemsWithNextAt = [...itemsWithNextAt, ...remainingItems];
    }

    // Step 4: Mark items as initial practice based on started grammar
    const itemsWithGrammarFlag: UserItemPractice[] = itemsWithNextAt.map((item) => ({
      ...item,
      is_initial_practice: !startedGrammar.some(
        (grammar) => grammar.id === item.grammar_id || item.grammar_id === 0,
      ),
    }));

    return sortOddEvenByProgress(itemsWithGrammarFlag);
  }

  /**
   * Saves the practiced deck items to the database.
   * @param items array of already practiced UserItemLocal objects.
   * @returns boolean indicating success.
   * @throws error if operation fails.
   */
  static async savePracticeDeck(userId: string, items: UserItemLocal[]): Promise<boolean> {
    items.map((item) => {
      if (item.user_id !== userId) {
        throw new Error(`Item user_id ${item.user_id} does not match provided userId ${userId}.`);
      }
    });

    const currentDateTime = new Date(Date.now()).toISOString();
    const updatedItems = items.map((item) => {
      return {
        ...item,
        next_at: getNextAt(item.progress),
        started_at:
          item.started_at === config.database.nullReplacementDate
            ? currentDateTime
            : item.started_at,
        updated_at: currentDateTime,
        mastered_at:
          item.mastered_at === config.database.nullReplacementDate &&
          item.progress >= config.srs.intervals.length
            ? currentDateTime
            : item.mastered_at,
      };
    });

    await db.user_items.bulkPut(updatedItems);
    await UserScore.addItemCount(userId, updatedItems.length);

    triggerUserItemsUpdatedEvent(userId);
    return true;
  }

  /**
   * Fetches started counts for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns object containing startedCountToday and startedCount.
   * @throws error if operation fails.
   */
  static async getStartedCounts(userId: string): Promise<{
    startedCountToday: number;
    startedCount: number;
  }> {
    const today = getTodayShortDate();
    const startedItems = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, config.database.nullReplacementDate], true, false)
      .toArray();

    const startedCount = startedItems.length;
    const startedCountToday = startedItems.filter((item) =>
      getLocalDateFromUTC(item.started_at).startsWith(today),
    ).length;

    return { startedCountToday, startedCount };
  }

  /**
   * Fetches all started vocabulary items for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns array of UserItemLocal objects.
   * @throws error if operation fails.
   */
  static async getUserStartedVocabulary(userId: string): Promise<UserItemLocal[]> {
    const result = await db.user_items
      .where('[user_id+grammar_id+started_at]')
      .between(
        [userId, config.database.nullReplacementNumber, Dexie.minKey],
        [userId, config.database.nullReplacementNumber, config.database.nullReplacementDate],
        true,
        false,
      )
      .sortBy('czech');

    return result;
  }

  /**
   * Resets all user items for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns number of reset items.
   * @throws error if operation fails.
   */
  static async resetAllUserItems(userId: string): Promise<number> {
    const count = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, config.database.nullReplacementDate], true, false)
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    console.log(`Reset ${count} user items for userId: ${userId}`);
    if (count !== 0) {
      triggerUserItemsUpdatedEvent(userId);
    }
    return count;
  }

  /**
   * Resets user items associated with a specific grammar ID.
   * @param userId - The ID of the logged-in user.
   * @param grammarId - The grammar ID whose items should be cleared.
   * @returns void
   * @throws error if operation fails.
   */
  static async resetGrammarItems(userId: string, grammarId: number): Promise<number> {
    console.log(`Resetting user items for userId: ${userId}, grammarId: ${grammarId}`);
    const count = await db.user_items
      .where('[user_id+grammar_id+started_at]')
      .between(
        [userId, config.database.nullReplacementNumber, Dexie.minKey],
        [userId, config.database.nullReplacementNumber, config.database.nullReplacementDate],
        true,
        false,
      )
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    if (count === 0) {
      throw new Error(`No user items found for grammar ID ${grammarId}.`);
    }

    triggerUserItemsUpdatedEvent(userId);
    return count;
  }

  /**
   * Resets a specific user item by its ID.
   * @param userId - The ID of the logged-in user.
   * @param itemId  - The ID of the item to reset.
   * @returns boolean indicating success.
   * @throws error if operation fails.
   */
  static async resetUserItemById(userId: string, itemId: number): Promise<boolean> {
    const count = await db.user_items
      .where('[user_id+item_id]')
      .equals([userId, itemId])
      .modify((item: UserItemLocal) => {
        console.log('Resetting item:', item);
        resetUserItem(item);
      });

    if (count === 0) {
      throw new Error(`No user items found for item ID ${itemId}.`);
    }

    triggerUserItemsUpdatedEvent(userId);
    return true;
  }

  /**
   * Deletes all user items for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns number of deleted items.
   * @throws error if operation fails.
   */
  static async deleteAllUserItems(userId: string): Promise<number> {
    // Get all item IDs for the user
    const itemIds = await db.user_items.where('user_id').equals(userId).primaryKeys();

    if (itemIds.length > 0) {
      await db.user_items.bulkDelete(itemIds);
      triggerUserItemsUpdatedEvent(userId);
    }

    console.log(`Deleted ${itemIds.length} user items for userId: ${userId}`);
    return itemIds.length;
  }

  /**
   * Synchronizes user items data between local IndexedDB and Supabase.
   * @param userId - The ID of the logged-in user.
   * @returns boolean indicating success.
   * @throws error if operation fails.
   */
  static async syncUserItemsData(userId: string): Promise<number> {
    // Step 1: Get the last synced date for the user_items table
    const lastSyncedAt = await Metadata.getSyncedDate(TableName.UserItems, userId);

    // Step 2: Fetch synced server time
    const newSyncTime = new Date().toISOString();

    // Step 3: Fetch all local user items from IndexedDB newer than last synced date
    const localUserItems: UserItemLocal[] = await db.user_items
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, Dexie.maxKey])
      .toArray();

    const sqlUserItems = localUserItems.map(convertLocalToSQL);

    // Step 4: Call the RPC function to insert updated user items
    const { error: rpcInsertError } = await supabaseInstance.rpc('insert_user_items', {
      user_id_input: userId,
      items: sqlUserItems,
    });

    if (rpcInsertError) {
      throw new Error('Synchronization disallowed for annonymous users.');
    }

    // Step 5: Call the RPC function to fetch updated user item IDs
    const { data: updatedUserItems, error: rpcFetchError } = await supabaseInstance.rpc(
      'fetch_user_items',
      {
        user_id_input: userId,
        last_synced_at: lastSyncedAt,
      },
    );

    if (rpcFetchError) {
      throw new Error('Error fetching user_items with Supabase:', rpcFetchError);
    }

    // Step 5: Separate items into those to delete and those to upsert
    const toDelete: number[] = [];
    const toUpsert: UserItemLocal[] = [];
    updatedUserItems.forEach((item: UserItemLocal) => {
      if (item.deleted_at === null) {
        toUpsert.push(item);
      } else {
        toDelete.push(item.item_id);
      }
    });

    // Step 6: Perform deletions and upserts
    if (toDelete.length > 0) {
      await db.user_items.bulkDelete(toDelete);
    }

    if (toUpsert.length > 0) {
      await db.user_items.bulkPut(toUpsert);
    }

    // Step 7: Trigger event and update metadata
    await Metadata.markAsSynced(TableName.UserItems, newSyncTime, userId);

    return updatedUserItems.length;
  }
}
