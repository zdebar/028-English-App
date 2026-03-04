import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { TableName } from '@/types/local.types';
import type { UserItemLocal, UserItemPractice } from '@/types/local.types';
import Dexie, { Entity } from 'dexie';
import { assertNonNegativeInteger, assertPositiveInteger } from '@/utils/assertions.utils';
import { splitDeleted } from '../utils/data-sync.utils';

import {
  convertLocalToSQL,
  convertSQLToLocal,
  getNextAt,
  getSyncTimestamps,
  resetUserItem,
  triggerUserItemsUpdatedEvent,
} from '@/database/utils/database.utils';
import { infoHandler } from '@/features/logging/info-handler';
import Grammar from './grammar';
import Metadata from './metadata';
import UserScore from './user-scores';
import { SupabaseError } from '@/types/error.types';
import { addGrammarIndicatorFlag } from '@/database/utils/database.utils';
import type { UserItemSQL } from '@/types/sql.types';

const NULL_DATE = config.database.nullReplacementDate;

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
  item_sort_order!: number;
  grammar_id!: number;
  progress!: number;
  started_at!: string;
  updated_at!: string;
  deleted_at!: string | null;
  next_at!: string;
  mastered_at!: string;
  lesson_id!: number;

  /**
   * Retrieves a practice deck of user items for studying.
   *
   * @param userId - The unique identifier of the user
   * @param deckSize - The maximum number of items to return (defaults to config.lesson.deckSize)
   */
  static async getPracticeDeck(
    userId: string,
    deckSize: number = config.lesson.deckSize,
  ): Promise<UserItemPractice[]> {
    assertPositiveInteger(deckSize, 'deckSize');

    // Step 1: Fetch already started grammar list
    const startedGrammarIdSet = new Set(await Grammar.getStartedIds(userId));

    // Step 2: Fetch items with odd progress
    let practiceItems = await this.getPracticeItemsByParity(userId, true, false, deckSize);

    // Step 3: If not enough items, fetch even progress items instead
    if (practiceItems.length < deckSize) {
      practiceItems = await this.getPracticeItemsByParity(userId, false, false, deckSize);

      const remainingLimit = deckSize - practiceItems.length;
      if (remainingLimit > 0) {
        const remainingItems = await this.getPracticeItemsByParity(
          userId,
          false,
          true,
          remainingLimit,
        );
        practiceItems = [...practiceItems, ...remainingItems];
      }
    }

    return addGrammarIndicatorFlag(practiceItems, startedGrammarIdSet);
  }

  /**
   * Saves practice deck items for a user, updating their progress and metadata.
   *
   * @param userId - The unique identifier of the user
   * @param items - Array of user item records to be saved
   */
  static async savePracticeDeck(userId: string, items: UserItemPractice[]): Promise<void> {
    if (!items || items.length === 0)
      throw new Error('Items array is required and cannot be empty to save practice deck.');

    const currentDateTime = new Date(Date.now()).toISOString();
    const updatedItems = items.map((item) => {
      return {
        ...item,
        next_at: getNextAt(item.progress),
        started_at: item.started_at === NULL_DATE ? currentDateTime : item.started_at,
        updated_at: currentDateTime,
        mastered_at:
          item.mastered_at === NULL_DATE && item.progress >= config.srs.intervals.length
            ? currentDateTime
            : item.mastered_at,
      };
    });

    await Promise.allSettled([
      db.user_items.bulkPut(updatedItems),
      UserScore.addItemCount(userId, updatedItems.length),
    ]);

    triggerUserItemsUpdatedEvent(userId);
  }

  /**
   * Retrieves vocabulary items for a user that have been started (begun learning). Sorted by czech word.
   *
   * @param userId - The unique identifier of the user
   */
  static async getStartedVocabulary(userId: string): Promise<UserItemLocal[]> {
    const result = await db.user_items
      .where('[user_id+grammar_id+started_at]')
      .between(
        [userId, config.database.nullReplacementNumber, Dexie.minKey],
        [userId, config.database.nullReplacementNumber, NULL_DATE],
        true,
        false,
      )
      .sortBy('czech');

    return result;
  }

  /**
   * Resets a user item to its default state by user and item ID.
   *
   * @param userId - The unique identifier of the user
   * @param itemId - The unique identifier of the item to reset
   */
  static async resetItemById(userId: string, itemId: number): Promise<void> {
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
    triggerUserItemsUpdatedEvent(userId);
  }

  /**
   * Deletes all user items associated with a specific user.
   *
   * @param userId - The unique identifier of the user
   */
  static async deleteAllItems(userId: string): Promise<void> {
    await db.user_items.where('user_id').equals(userId).delete();
  }

  static async syncFromRemote(userId: string, doFullSync: boolean = false): Promise<void> {
    // Step 1: Get the last synced timestamp for user scores
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(doFullSync, userId);

    // Step 2: Push local changes to Supabase
    const localItems = await this.getUserItemsForSync(userId, lastSyncedAt, newSyncedAt);
    await this.postToRemote(localItems);

    // Step 3: Pull items from Supabase
    const updatedItems = await this.fetchFromRemote(userId, lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedItems);

    // Step 4: Update local database with fetched items and update sync metadata
    await db.transaction('rw', db.user_items, db.metadata, async () => {
      if (doFullSync) {
        await this.deleteAllItems(userId);
      } else if (toDelete.length > 0) {
        await db.user_items.bulkDelete(toDelete.map((item) => [item.user_id, item.item_id]));
      }
      if (toUpsert.length > 0) {
        await db.user_items.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.UserItems, newSyncedAt, userId);
    });
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
  ): Promise<UserItemSQL[]> {
    const localUserItems: UserItemLocal[] = await db.user_items
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    if (localUserItems.length === 0) {
      infoHandler(`No user items to push for userId: ${userId}`);
      return [];
    }

    return localUserItems.map(convertLocalToSQL);
  }

  /**
   * Pushes local user items to Supabase for synchronization.
   *
   * @param items - An array of user items in SQL format to be pushed to the remote server.
   */
  private static async postToRemote(items: UserItemSQL[]): Promise<void> {
    if (items.length === 0) return;

    const { error: rpcInsertError } = await supabaseInstance.rpc('upsert_user_items', {
      p_user_items: items,
    });

    if (rpcInsertError) {
      throw new SupabaseError('Error inserting user_items to Supabase.', rpcInsertError, {
        itemCount: items.length,
      });
    }

    infoHandler(
      `Completed ${items.length} user items push to Supabase for userId: ${items[0].user_id}`,
    );
  }

  /**
   * Fetches user items from Supabase that have been updated since the specified timestamp.
   *
   * @param userId - The ID of the user whose items should be fetched.
   * @param lastSyncedAt - The timestamp of the last synchronization.
   */
  private static async fetchFromRemote(
    userId: string,
    lastSyncedAt: string,
  ): Promise<UserItemLocal[]> {
    const { data: updatedUserItems, error: rpcFetchError } = await supabaseInstance.rpc(
      'fetch_user_items',
      {
        p_user_id: userId,
        p_last_synced_at: lastSyncedAt,
      },
    );

    if (rpcFetchError) {
      throw new SupabaseError('Error fetching user_items with Supabase.', rpcFetchError, {
        userId,
        lastSyncedAt,
      });
    }

    return (updatedUserItems ?? []).map((item: UserItemLocal) => convertSQLToLocal(item));
  }

  /**
   * Fetches practice items by odd/even progress parity for a user.
   *
   * @param userId - The unique identifier of the user
   * @param isOdd - Whether to fetch items with odd progress
   * @param isNew - Whether to fetch non-started items (next_at = NULL_DATE) or ready to practice items (next_at < today)
   * @param limit - Maximum number of items to fetch
   */
  private static async getPracticeItemsByParity(
    userId: string,
    isOdd: boolean,
    isNew: boolean = false,
    limit: number,
  ): Promise<UserItemLocal[]> {
    const minNextAt = isNew ? NULL_DATE : Dexie.minKey;
    const maxNextAt = isNew ? NULL_DATE : new Date().toISOString();
    return db.user_items
      .where('[user_id+next_at+item_sort_order]')
      .between([userId, minNextAt, Dexie.minKey], [userId, maxNextAt, Dexie.maxKey], true, false)
      .filter((item) => (item.progress % 2 === 1) === isOdd)
      .limit(limit)
      .toArray();
  }
}
