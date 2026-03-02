import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { TableName } from '@/types/local.types';
import type {
  UserItemLocal,
  UserItemPractice,
  LessonsOverview,
  LevelsOverview,
} from '@/types/local.types';
import Dexie, { Entity } from 'dexie';
import { assertNonNegativeInteger, assertPositiveInteger } from '@/utils/assertions.utils';

import {
  convertLocalToSQL,
  convertSQLToLocal,
  getLocalDateFromUTC,
  getNextAt,
  getTodayShortDate,
  resetUserItem,
  triggerUserItemsUpdatedEvent,
} from '@/database/database.utils';
import { infoHandler } from '@/features/logging/info-handler';
import Grammar from './grammar';
import Metadata from './metadata';
import UserScore from './user-scores';
import { SupabaseError } from '@/types/error.types';

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
  level_id!: number | null;
  level_sort_order!: number | null;
  level_name!: string | null;
  lesson_id!: number | null;
  lesson_sort_order!: number | null;
  lesson_name!: string | null;

  /**
   * Retrieves a practice deck of user items for studying.
   *
   * @param userId - The unique identifier of the user
   * @param deckSize - The maximum number of items to return (defaults to config.lesson.deckSize)
   * @returns A promise that resolves to an array of UserItemPractice objects,
   *          sorted by progress with odd/even distribution
   * @throws Error if any database operation fails
   */
  static async getPracticeDeck(
    userId: string,
    deckSize: number = config.lesson.deckSize,
  ): Promise<UserItemPractice[]> {
    if (!userId) throw new Error('User ID is required to fetch practice deck.');
    assertPositiveInteger(deckSize, 'deckSize');

    // Step 1: Fetch already started grammar list
    const startedGrammarIdSet = new Set(await Grammar.getStartedGrammarIds(userId));
    const nowIso = new Date().toISOString();

    const fetchDueItemsByParity = async (isOdd: boolean, limit: number): Promise<UserItemLocal[]> =>
      db.user_items
        .where('[user_id+next_at+mastered_at]')
        .between([userId, Dexie.minKey, NULL_DATE], [userId, nowIso, NULL_DATE])
        .filter((item) => (item.progress % 2 === 1) === isOdd)
        .limit(limit)
        .toArray();

    // Step 2: Fetch items with odd progress
    // SELECT with user_id, next_at = null, mastered_at = null, progress odd
    let itemsWithNextAt: UserItemLocal[] = await fetchDueItemsByParity(true, deckSize);

    // Step 3: If not enough items, fetch items with even progress
    // SELECT with user_id, next_at = null, mastered_at = null, progress even
    if (itemsWithNextAt.length < deckSize) {
      itemsWithNextAt = await fetchDueItemsByParity(false, deckSize - itemsWithNextAt.length);

      const remainingLimit = deckSize - itemsWithNextAt.length;
      if (remainingLimit > 0) {
        const remainingItems = await db.user_items
          .where('[user_id+next_at+mastered_at+item_sort_order]')
          .between(
            [userId, NULL_DATE, NULL_DATE, Dexie.minKey],
            [userId, NULL_DATE, NULL_DATE, Dexie.maxKey],
            true,
            false,
          )
          .limit(remainingLimit)
          .toArray();
        itemsWithNextAt = [...itemsWithNextAt, ...remainingItems];
      }
    }

    // Step 4: Mark items as grammar initial practice based on started grammar
    const shownGrammarIds = new Set<number>();
    const itemsWithGrammarFlag: UserItemPractice[] = itemsWithNextAt.map((item) => {
      let show = false;
      if (
        item.grammar_id !== 0 &&
        !startedGrammarIdSet.has(item.grammar_id) &&
        !shownGrammarIds.has(item.grammar_id)
      ) {
        show = true;
        shownGrammarIds.add(item.grammar_id);
      }
      return {
        ...item,
        show_new_grammar_indicator: show,
      };
    });

    return itemsWithGrammarFlag;
  }

  /**
   * Saves practice deck items for a user, updating their progress and metadata.
   *
   * @param userId - The unique identifier of the user
   * @param items - Array of user item records to be saved
   * @returns Promise that resolves when the save operation completes successfully
   * @throws Error if any database operation fails
   */
  static async savePracticeDeck(userId: string, items: UserItemLocal[]): Promise<void> {
    if (!userId) throw new Error('User ID is required to save practice deck.');

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

    await db.user_items.bulkPut(updatedItems);
    await UserScore.addItemCount(userId, updatedItems.length);

    triggerUserItemsUpdatedEvent(userId);
  }

  /**
   * Retrieves vocabulary items for a user that have been started (begun learning).
   *
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves to an array of user vocabulary items sorted by Czech translation
   */
  static async getUserStartedVocabulary(userId: string): Promise<UserItemLocal[]> {
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
   * Retrieves an overview of levels for a user, including counts of started and mastered items.
   *
   * @param userId - The unique identifier of the user
   * @returns - A promise that resolves to an array of LevelsOverview objects, each containing level details and associated lessons with their counts
   * @throws Error if userId is not provided
   */
  static async getLevelsOverview(userId: string): Promise<LevelsOverview[]> {
    if (!userId) throw new Error('User ID is required to fetch levels overview.');

    const today = getTodayShortDate();
    const result = await db.user_items.where('user_id').equals(userId).toArray();

    const filtered = result.filter(
      (item) =>
        !(
          item.lesson_id == null ||
          item.lesson_name == null ||
          item.lesson_sort_order == null ||
          item.level_id == null ||
          item.level_name == null ||
          item.level_sort_order == null
        ),
    );

    // 1. Aggregate lessons
    const lessonsMap = new Map<number, LessonsOverview>();
    filtered.forEach((item) => {
      const prev = lessonsMap.get(item.lesson_id!);
      lessonsMap.set(item.lesson_id!, {
        lesson_id: item.lesson_id!,
        lesson_sort_order: item.lesson_sort_order!,
        lesson_name: item.lesson_name!,
        level_id: item.level_id!,
        level_sort_order: item.level_sort_order!,
        level_name: item.level_name!,
        startedCount: (prev?.startedCount ?? 0) + (item.started_at !== NULL_DATE ? 1 : 0),
        startedTodayCount:
          (prev?.startedTodayCount ?? 0) +
          (getLocalDateFromUTC(item.started_at).startsWith(today) ? 1 : 0),
        masteredCount: (prev?.masteredCount ?? 0) + (item.mastered_at !== NULL_DATE ? 1 : 0),
        masteredTodayCount:
          (prev?.masteredTodayCount ?? 0) +
          (getLocalDateFromUTC(item.mastered_at).startsWith(today) ? 1 : 0),
        totalCount: (prev?.totalCount ?? 0) + 1,
      });
    });

    // 2. Aggregate levels
    const levelsMap = new Map<number, LevelsOverview>();
    for (const lesson of lessonsMap.values()) {
      const prev = levelsMap.get(lesson.level_id!);
      const updatedLessons = [...(prev?.lessons ?? []), lesson].sort((a, b) => {
        if (a.level_sort_order !== b.level_sort_order) {
          return a.level_sort_order - b.level_sort_order;
        }
        if (a.lesson_sort_order !== b.lesson_sort_order) {
          return a.lesson_sort_order - b.lesson_sort_order;
        }
        return a.lesson_id - b.lesson_id;
      });
      levelsMap.set(lesson.level_id!, {
        level_id: lesson.level_id!,
        level_sort_order: lesson.level_sort_order!,
        level_name: lesson.level_name!,
        startedCount: (prev?.startedCount ?? 0) + lesson.startedCount,
        startedTodayCount: (prev?.startedTodayCount ?? 0) + lesson.startedTodayCount,
        masteredCount: (prev?.masteredCount ?? 0) + lesson.masteredCount,
        masteredTodayCount: (prev?.masteredTodayCount ?? 0) + lesson.masteredTodayCount,
        totalCount: (prev?.totalCount ?? 0) + lesson.totalCount,
        lessons: updatedLessons,
      });
    }

    // 3. Return sorted array by level_sort_order
    return Array.from(levelsMap.values()).sort(
      (a, b) => (a.level_sort_order ?? 0) - (b.level_sort_order ?? 0),
    );
  }

  /**
   * Resets all user items for a specified user.
   *
   * @param userId - The ID of the user whose items should be reset
   * @returns A promise that resolves when the reset operation is complete
   * @throws Error if any database operation fails
   */
  static async resetAllUserItems(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to reset all user items.');

    const count = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, NULL_DATE], true, false)
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    infoHandler(`Reset ${count} user items for userId: ${userId}`);
    if (count !== 0) {
      triggerUserItemsUpdatedEvent(userId);
    }
  }

  /**
   * Resets grammar items for a specific user.
   *
   * @param userId - The unique identifier of the user
   * @param grammarId - The unique identifier of the grammar whose items should be reset
   * @returns A promise that resolves to the number of items that were reset
   * @throws Throws an error if no user items are found for the given grammar ID.
   */
  static async resetGrammarItems(userId: string, grammarId: number): Promise<void> {
    if (!userId) throw new Error('User ID is required to reset grammar items.');
    if (grammarId < 0) throw new Error('Grammar ID must be a non-negative integer.');
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

    infoHandler(`Resetted ${count} user items for userId: ${userId}, grammarId: ${grammarId}`);
    triggerUserItemsUpdatedEvent(userId);
  }

  /**
   * Resets a user item to its default state by user and item ID.
   *
   * @param userId - The unique identifier of the user
   * @param itemId - The unique identifier of the item to reset
   * @returns A promise that resolves when the item is successfully reset
   * @throws Throws an error if no user item is found for the specified item ID
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
}
