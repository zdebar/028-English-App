import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { TableName } from '@/types/local.types';
import type { UserItemLocal, UserItemPractice, LessonOverview } from '@/types/local.types';
import Dexie, { Entity } from 'dexie';
import { assertNonNegativeInteger, assertPositiveInteger } from '@/utils/assertions.utils';

import {
  convertLocalToSQL,
  convertSQLToLocal,
  getNextAt,
  getTodayShortDate,
  resetUserItem,
  triggerUserItemsUpdatedEvent,
  aggregateLessons,
} from '@/database/utils/database.utils';
import { infoHandler } from '@/features/logging/info-handler';
import Grammar from './grammar';
import Metadata from './metadata';
import UserScore from './user-scores';
import { SupabaseError } from '@/types/error.types';
import { addGrammarIndicatorFlag } from '@/database/utils/database.utils';

const NULL_DATE = config.database.nullReplacementDate;

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
  deleted_at!: null;
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
    if (!userId) throw new Error('User ID is required to fetch practice deck.');
    assertPositiveInteger(deckSize, 'deckSize');

    // Step 1: Fetch already started grammar list
    const startedGrammarIdSet = new Set(await Grammar.getStartedIds(userId));

    // Step 2: Fetch items with odd progress
    let practiceItems = await this.fetchPracticeItemsByParity(userId, true, false, deckSize);

    // Step 3: If not enough items, fetch even progress items instead
    if (practiceItems.length < deckSize) {
      practiceItems = await this.fetchPracticeItemsByParity(userId, false, false, deckSize);

      const remainingLimit = deckSize - practiceItems.length;
      if (remainingLimit > 0) {
        const remainingItems = await this.fetchPracticeItemsByParity(
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
    if (!userId) throw new Error('User ID is required to save practice deck.');
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
   * Retrieves vocabulary items for a user that have been started (begun learning).
   *
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves to an array of user vocabulary items sorted by Czech translation
   */
  static async getStartedVocabulary(userId: string): Promise<UserItemLocal[]> {
    if (!userId) throw new Error('User ID is required to fetch started vocabulary.');

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
   * Retrieves an overview of lessons for a user, including counts of started and mastered items.
   *
   * @param userId - The unique identifier of the user
   * @returns - A promise that resolves to an array of LessonOverview objects, each containing lesson details and associated counts
   */
  static async getLessonsOverview(userId: string): Promise<LessonOverview[]> {
    if (!userId) throw new Error('User ID is required to fetch lessons overview.');

    const today = getTodayShortDate();
    const items = await db.user_items.where('user_id').equals(userId).toArray();
    const lessons = await db.lessons.orderBy('sort_order').toArray();
    return aggregateLessons(items, lessons, today);
  }

  /**
   * Resets a user item to its default state by user and item ID.
   *
   * @param userId - The unique identifier of the user
   * @param itemId - The unique identifier of the item to reset
   */
  static async resetUserItemById(userId: string, itemId: number): Promise<void> {
    if (!userId) throw new Error('User ID is required to reset user item.');
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
   * @returns A promise that resolves when all user items are deleted
   * @throws Error if any database operation fails
   */
  static async deleteAllUserItems(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to delete all user items.');

    const itemIds = await db.user_items.where('user_id').equals(userId).primaryKeys();
    if (itemIds.length > 0) {
      await db.user_items.bulkDelete(itemIds);
      triggerUserItemsUpdatedEvent(userId);
    }

    infoHandler(`Deleted ${itemIds.length} user items for userId: ${userId}`);
  }

  /**
   * Synchronizes user items since the last sync operation.
   *
   * @param userId - The unique identifier of the user whose items should be synchronized
   * @returns A promise that resolves when the sync operation is complete
   */
  static async syncUserItemsSinceLastSync(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to sync user items since last sync.');

    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserItems, userId);
    const newSyncedAt = new Date().toISOString();
    await this.pushUserItemsToSupabase(userId, lastSyncedAt, newSyncedAt);
    await this.pullUserItemsFromSupabase(userId, lastSyncedAt, newSyncedAt);
  }

  /**
   * Synchronizes all user items for a given user by pushing local changes to Supabase,
   * clearing the local cache, and pulling the latest items from Supabase.
   *
   * @param userId - The ID of the user whose items should be synchronized
   * @returns A promise that resolves when the synchronization is complete
   */
  static async syncUserItemsAll(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to sync all user items.');

    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserItems, userId);
    const newSyncedAt = new Date().toISOString();
    await this.pushUserItemsToSupabase(userId, lastSyncedAt, newSyncedAt);
    await db.user_items.where('user_id').equals(userId).delete();
    await this.pullUserItemsFromSupabase(userId, config.database.epochStartDate, newSyncedAt);
  }

  /**
   * Pushes local user items to Supabase that were updated within a specified time range.
   *
   * @param userId - The ID of the user whose items should be synced
   * @param lastSyncedAt - The timestamp of the last sync (exclusive lower bound)
   * @param newSyncedAt - The timestamp of the new sync (inclusive upper bound)
   * @returns A promise that resolves when the items are pushed to Supabase
   * @throws {SupabaseError} If the RPC call to insert user items fails
   *
   * @private
   * @static
   */
  private static async pushUserItemsToSupabase(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<void> {
    if (!userId) throw new Error('User ID is required to push user items to Supabase.');
    if (!lastSyncedAt)
      throw new Error('Last synced timestamp is required to push user items to Supabase.');
    if (!newSyncedAt)
      throw new Error('New synced timestamp is required to push user items to Supabase.');

    const localUserItems: UserItemLocal[] = await db.user_items
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    if (localUserItems.length === 0) {
      infoHandler(`No user items to push for userId: ${userId}`);
      return;
    }

    const sqlUserItems = localUserItems.map(convertLocalToSQL);
    const { error: rpcInsertError } = await supabaseInstance.rpc('upsert_user_items', {
      p_user_id: userId,
      p_user_items: sqlUserItems,
    });

    if (rpcInsertError) {
      throw new SupabaseError('Error inserting user_items to Supabase.', rpcInsertError, {
        userId,
      });
    }

    infoHandler(
      `Completed ${localUserItems.length} user items push to Supabase for userId: ${userId}`,
    );
  }

  /**
   * Pulls user items from Supabase and syncs them with the local database.
   *
   * @param userId - The ID of the user whose items to fetch
   * @param lastSyncedAt - ISO 8601 timestamp of the last successful sync
   * @param newSyncedAt - ISO 8601 timestamp to mark as the new sync time
   * @returns Promise resolving when the user items are pulled from Supabase
   * @throws {SupabaseError} If the RPC call to fetch user items fails
   * @private
   */
  private static async pullUserItemsFromSupabase(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<void> {
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

    const serverItems = (updatedUserItems ?? []).map((item: UserItemLocal) =>
      convertSQLToLocal(item),
    );

    const toDelete: [string, number][] = [];
    const toUpsert: UserItemLocal[] = [];
    serverItems.forEach((item: UserItemLocal) => {
      if (item.deleted_at === null) {
        toUpsert.push(item);
      } else {
        toDelete.push([userId, item.item_id]);
      }
    });

    await db.transaction('rw', db.user_items, db.metadata, async () => {
      if (toDelete.length > 0) {
        await db.user_items.bulkDelete(toDelete);
      }
      if (toUpsert.length > 0) {
        await db.user_items.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.UserItems, newSyncedAt, userId);
    });

    infoHandler(
      `Completed ${serverItems.length} user items pull from Supabase for userId: ${userId}`,
    );
  }

  /**
   * Fetches practice items by odd/even progress parity for a user.
   *
   * @param userId - The unique identifier of the user
   * @param isOdd - Whether to fetch items with odd progress
   * @param isNew - Whether to fetch non-started items (next_at = NULL_DATE) or ready to practice items (next_at < today)
   * @param limit - Maximum number of items to fetch
   * @returns A promise that resolves to an array of UserItemLocal
   */
  static async fetchPracticeItemsByParity(
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
