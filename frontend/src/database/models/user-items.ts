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
  deleted_at!: null;
  next_at!: string;
  mastered_at!: string;
  level_id!: number | null;
  level_name!: string | null;
  lesson_id!: number | null;
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
    assertPositiveInteger(deckSize, 'deckSize');

    // Step 1: Fetch already started grammar list
    const startedGrammar = await Grammar.getStartedGrammarList(userId);

    // Step 2: Fetch items with odd progress
    // SELECT with user_id, next_at = null, mastered_at = null, progress odd
    let itemsWithNextAt: UserItemLocal[] = await db.user_items
      .where('[user_id+next_at+mastered_at]')
      .between(
        [userId, Dexie.minKey, config.database.nullReplacementDate],
        [userId, new Date().toISOString(), config.database.nullReplacementDate],
      )
      .filter((item) => item.progress % 2 === 1)
      .limit(deckSize)
      .toArray();

    // Step 3: If not enough items, fetch items with even progress
    // SELECT with user_id, next_at = null, mastered_at = null, progress even
    if (itemsWithNextAt.length < deckSize) {
      itemsWithNextAt = await db.user_items
        .where('[user_id+next_at+mastered_at]')
        .between(
          [userId, Dexie.minKey, config.database.nullReplacementDate],
          [userId, new Date().toISOString(), config.database.nullReplacementDate],
        )
        .filter((item) => item.progress % 2 === 0)
        .limit(deckSize)
        .toArray();
    }

    // Step 4: If not enough items, fetch additional items with next_at equal to nullReplacementDate
    // SELECT with user_id, next_at = null, mastered_at = null, ordered by sequence ASC
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

    if (itemsWithNextAt.length < deckSize) {
      return [];
    }

    // Step 4: Mark items as grammar initial practice based on started grammar
    const shownGrammarIds = new Set<number>();
    const itemsWithGrammarFlag: UserItemPractice[] = itemsWithNextAt.map((item) => {
      let show = false;
      if (
        item.grammar_id !== 0 &&
        !startedGrammar.some((grammar) => grammar.id === item.grammar_id) &&
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
   * @returns Promise that resolves to true when the save operation completes successfully
   * @throws Error if any database operation fails
   */
  static async savePracticeDeck(userId: string, items: UserItemLocal[]): Promise<boolean> {
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
   * Retrieves the count of started items for a user, both today and in total.
   *
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves to an object containing:
   *   - startedCountToday: The number of items started by the user today
   *   - startedCount: The total number of items started by the user
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
   * Retrieves vocabulary items for a user that have been started (begun learning).
   *
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves to an array of user vocabulary items sorted by Czech translation
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
   * Retrieves an overview of levels for a user, including counts of started and mastered items.
   *
   * @param userId - The unique identifier of the user
   * @returns - A promise that resolves to an array of LevelsOverview objects, each containing level details and associated lessons with their counts
   */
  static async getLevelsOverview(userId: string): Promise<LevelsOverview[]> {
    const result = await db.user_items.where('user_id').equals(userId).toArray();

    // 1. Aggregate lessons
    const lessonsMap = new Map<number, LessonsOverview>();
    result.forEach((item) => {
      if (item.lesson_id == null) return;
      const prev = lessonsMap.get(item.lesson_id);
      lessonsMap.set(item.lesson_id, {
        lesson_id: item.lesson_id,
        lesson_name: item.lesson_name ?? null,
        level_id: item.level_id ?? null,
        level_name: item.level_name ?? null,
        startedCount:
          (prev?.startedCount ?? 0) +
          (item.started_at !== config.database.nullReplacementDate ? 1 : 0),
        masteredCount:
          (prev?.masteredCount ?? 0) +
          (item.mastered_at !== config.database.nullReplacementDate ? 1 : 0),
        totalCount: (prev?.totalCount ?? 0) + 1,
      });
    });

    // 2. Aggregate levels
    const levelsMap = new Map<number, LevelsOverview>();
    for (const lesson of lessonsMap.values()) {
      if (lesson.level_id == null) continue;
      const prev = levelsMap.get(lesson.level_id);
      const updatedLessons = [...(prev?.lessons ?? []), lesson].sort(
        (a, b) => (a.lesson_id ?? 0) - (b.lesson_id ?? 0),
      );
      levelsMap.set(lesson.level_id, {
        level_id: lesson.level_id,
        level_name: lesson.level_name,
        startedCount: (prev?.startedCount ?? 0) + lesson.startedCount,
        masteredCount: (prev?.masteredCount ?? 0) + lesson.masteredCount,
        totalCount: (prev?.totalCount ?? 0) + lesson.totalCount,
        lessons: updatedLessons,
      });
    }

    // 3. Return sorted array (optional: sort by level_id)
    return Array.from(levelsMap.values()).sort((a, b) => (a.level_id ?? 0) - (b.level_id ?? 0));
  }

  /**
   * Retrieves the count of mastered and total items for a specific grammar topic for a user.
   *
   * @param userId - The unique identifier of the user
   * @param grammarId - The unique identifier of the grammar topic
   * @returns - An object containing the count of mastered items and total items for the specified grammar topic
   */
  static async getGrammarItemsCounts(
    userId: string,
    grammarId: number,
  ): Promise<{ startedCount: number; masteredCount: number; totalCount: number }> {
    const result = await db.user_items
      .where('[user_id+grammar_id]')
      .equals([userId, grammarId])
      .toArray();

    const masteredCount = result.filter(
      (item) => item.mastered_at !== config.database.nullReplacementDate,
    ).length;
    const startedCount = result.filter(
      (item) => item.started_at !== config.database.nullReplacementDate,
    ).length;
    const totalCount = result.length;
    return { startedCount, masteredCount, totalCount };
  }

  /**
   * Retrieves the total count of user items that have been started by a specific user.
   *
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves to the count of started user items for the specified user
   */
  static async getUserItemsCount(userId: string): Promise<number> {
    const result = await db.user_items.where('user_id').equals(userId).count();

    return result;
  }

  /**
   * Resets all user items for a specified user.
   *
   * @param userId - The ID of the user whose items should be reset
   * @returns A promise that resolves to the number of user items that were reset
   * @throws Error if any database operation fails
   */
  static async resetAllUserItems(userId: string): Promise<number> {
    const count = await db.user_items
      .where('[user_id+started_at]')
      .between([userId, Dexie.minKey], [userId, config.database.nullReplacementDate], true, false)
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    infoHandler(`Reset ${count} user items for userId: ${userId}`);
    if (count !== 0) {
      triggerUserItemsUpdatedEvent(userId);
    }
    return count;
  }

  /**
   * Resets grammar items for a specific user.
   *
   * @param userId - The unique identifier of the user
   * @param grammarId - The unique identifier of the grammar whose items should be reset
   * @returns A promise that resolves to the number of items that were reset
   * @throws Throws an error if no user items are found for the given grammar ID.
   */
  static async resetGrammarItems(userId: string, grammarId: number): Promise<number> {
    assertNonNegativeInteger(grammarId, 'grammarId');

    const count = await db.user_items
      .where('[user_id+grammar_id+started_at]')
      .between(
        [userId, grammarId, Dexie.minKey],
        [userId, grammarId, config.database.nullReplacementDate],
        true,
        false,
      )
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    if (count === 0) {
      throw new Error(`No user items found for grammar ID ${grammarId}.`);
    }

    infoHandler(`Resetted ${count} user items for userId: ${userId}, grammarId: ${grammarId}`);
    triggerUserItemsUpdatedEvent(userId);
    return count;
  }

  /**
   * Resets a user item to its default state by user and item ID.
   *
   * @param userId - The unique identifier of the user
   * @param itemId - The unique identifier of the item to reset
   * @returns A promise that resolves to true if the item was successfully reset
   * @throws Throws an error if no user item is found for the specified item ID
   */
  static async resetUserItemById(userId: string, itemId: number): Promise<boolean> {
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
    return true;
  }

  /**
   * Deletes all user items associated with a specific user.
   *
   * @param userId - The unique identifier of the user
   * @returns A promise that resolves to the number of items deleted
   * @throws Error if any database operation fails
   */
  static async deleteAllUserItems(userId: string): Promise<number> {
    const itemIds = await db.user_items.where('user_id').equals(userId).primaryKeys();

    if (itemIds.length > 0) {
      await db.user_items.bulkDelete(itemIds);
      triggerUserItemsUpdatedEvent(userId);
    }

    infoHandler(`Deleted ${itemIds.length} user items for userId: ${userId}`);
    return itemIds.length;
  }

  /**
   * Synchronizes user items since the last sync operation.
   *
   * @param userId - The unique identifier of the user whose items should be synchronized
   * @returns A promise that resolves when the sync operation is complete
   */
  static async syncUserItemsSinceLastSync(userId: string): Promise<void> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserItems, userId);
    const newSyncedAt = new Date().toISOString();
    await UserItem.pushUserItemsToSupabase(userId, lastSyncedAt, newSyncedAt);
    await UserItem.pullUserItemsFromSupabase(userId, lastSyncedAt, newSyncedAt);
  }

  /**
   * Synchronizes all user items for a given user by pushing local changes to Supabase,
   * clearing the local cache, and pulling the latest items from Supabase.
   *
   * @param userId - The ID of the user whose items should be synchronized
   * @returns A promise that resolves when the synchronization is complete
   */
  static async syncUserItemsAll(userId: string): Promise<void> {
    const lastSyncedAt = await Metadata.getSyncedAt(TableName.UserItems, userId);
    const newSyncedAt = new Date().toISOString();
    await UserItem.pushUserItemsToSupabase(userId, lastSyncedAt, newSyncedAt);
    await db.user_items.where('user_id').equals(userId).delete();
    await UserItem.pullUserItemsFromSupabase(userId, config.database.epochStartDate, newSyncedAt);
  }

  /**
   * Pushes local user items to Supabase that were updated within a specified time range.
   *
   * @param userId - The ID of the user whose items should be synced
   * @param lastSyncedAt - The timestamp of the last sync (exclusive lower bound)
   * @param newSyncedAt - The timestamp of the new sync (inclusive upper bound)
   * @returns A promise that resolves to the number of items pushed to Supabase
   * @throws {SupabaseError} If the RPC call to insert user items fails
   *
   * @private
   * @static
   */
  private static async pushUserItemsToSupabase(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<number> {
    const localUserItems: UserItemLocal[] = await db.user_items
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();

    if (localUserItems.length !== 0) {
      const sqlUserItems = localUserItems.map(convertLocalToSQL);
      const { error: rpcInsertError } = await supabaseInstance.rpc('upsert_user_items', {
        user_id_input: userId,
        items: sqlUserItems,
      });

      if (rpcInsertError) {
        throw new SupabaseError('Error inserting user_items to Supabase.', rpcInsertError, {
          userId,
        });
      }
    }

    infoHandler(
      `Completed ${localUserItems.length} user items push to Supabase for userId: ${userId}`,
    );

    return localUserItems.length;
  }

  /**
   * Pulls user items from Supabase and syncs them with the local database.
   *
   * @param userId - The ID of the user whose items to fetch
   * @param lastSyncedAt - ISO 8601 timestamp of the last successful sync
   * @param newSyncedAt - ISO 8601 timestamp to mark as the new sync time
   * @returns Promise resolving to an array of user items from Supabase
   * @throws {SupabaseError} If the RPC call to fetch user items fails
   * @private
   */
  private static async pullUserItemsFromSupabase(
    userId: string,
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<number> {
    const { data: updatedUserItems, error: rpcFetchError } = await supabaseInstance.rpc(
      'fetch_user_items',
      {
        user_id_input: userId,
        last_synced_at: lastSyncedAt,
      },
    );

    if (rpcFetchError) {
      throw new SupabaseError('Error fetching user_items with Supabase.', rpcFetchError, {
        userId,
        lastSyncedAt,
      });
    }

    const toDelete: [string, number][] = [];
    const toUpsert: UserItemLocal[] = [];
    updatedUserItems.forEach((item: UserItemLocal) => {
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
      `Completed ${updatedUserItems.length} user items pull from Supabase for userId: ${userId}`,
    );

    return updatedUserItems.length;
  }
}
