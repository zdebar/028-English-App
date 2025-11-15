import Dexie, { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import { db } from "@/database/models/db";

import { TableName, type UserItemLocal } from "@/types/local.types";
import type { UUID } from "crypto";

import config from "@/config/config";
import { supabaseInstance } from "@/config/supabase.config";

import { getNextAt, sortOddEvenByProgress } from "@/utils/practice.utils";
import {
  convertLocalToSQL,
  getTodayShortDate,
  getLocalDateFromUTC,
  triggerUserItemsUpdatedEvent,
  resetUserItem,
} from "@/utils/database.utils";
import UserScore from "./user-scores";
import Metadata from "./metadata";

export default class UserItem extends Entity<AppDB> implements UserItemLocal {
  item_id!: number;
  user_id!: UUID;
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
  learned_at!: string;
  mastered_at!: string;

  /**
   * Gets a practice deck of user items for the logged-in user.
   * @param userId the ID of the logged-in user.
   * @param deckSize number of items to include in the practice deck.
   * @returns array of UserItemLocal objects.
   * @throws error if operation fails.
   */
  static async getPracticeDeck(
    userId: UUID,
    deckSize: number = config.lesson.deckSize
  ): Promise<UserItemLocal[]> {
    // Step 1: Fetch items with next_at older than now, sorted by next_at
    const itemsWithNextAt: UserItemLocal[] = await db.user_items
      .where("[user_id+next_at]")
      .between(
        [userId, "0000-01-01T00:00:00.000Z"],
        [userId, new Date().toISOString()]
      )
      .limit(deckSize)
      .toArray();

    // If we already have enough items, return them
    if (itemsWithNextAt.length >= deckSize) {
      return sortOddEvenByProgress(itemsWithNextAt);
    }

    // Query 2: Fetch remaining items with next_at === nullReplacementDate, sorted by sequence
    const remainingItems: UserItemLocal[] = await db.user_items
      .where("[user_id+next_at]")
      .equals([userId, config.database.nullReplacementDate])
      .limit(deckSize - itemsWithNextAt.length)
      .sortBy("sequence");

    // Combine the results
    const combinedItems = [...itemsWithNextAt, ...remainingItems];

    if (combinedItems.length < deckSize) {
      return [];
    }

    return sortOddEvenByProgress(combinedItems);
  }

  /**
   * Saves the practiced deck items to the database.
   * @param items array of already practiced UserItemLocal objects.
   * @returns boolean indicating success.
   * @throws error if operation fails.
   */
  static async savePracticeDeck(
    userId: UUID,
    items: UserItemLocal[]
  ): Promise<boolean> {
    items.map((item) => {
      if (item.user_id !== userId) {
        throw new Error(
          `Item user_id ${item.user_id} does not match provided userId ${userId}.`
        );
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
        learned_at:
          item.learned_at === config.database.nullReplacementDate &&
          item.progress >= config.progress.learnedAtThreshold
            ? currentDateTime
            : item.learned_at,
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
   * Fetches learned counts for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns object containing learnedCountToday and learnedCount.
   * @throws error if operation fails.
   */
  static async getLearnedCounts(userId: UUID): Promise<{
    learnedCountToday: number;
    learnedCount: number;
  }> {
    const today = getTodayShortDate();
    const learnedItems = await db.user_items
      .where("[user_id+learned_at]")
      .between(
        [userId, Dexie.minKey],
        [userId, config.database.nullReplacementDate],
        true,
        false
      )
      .toArray();

    const learnedCount = learnedItems.length;
    const learnedCountToday = learnedItems.filter((item) =>
      getLocalDateFromUTC(item.learned_at).startsWith(today)
    ).length;

    return { learnedCountToday, learnedCount };
  }

  /**
   * Fetches all started vocabulary items for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns array of UserItemLocal objects.
   * @throws error if operation fails.
   */
  static async getUserStartedVocabulary(
    userId: UUID
  ): Promise<UserItemLocal[]> {
    const result = await db.user_items
      .where("[user_id+started_at+grammar_id]")
      .between(
        [userId, Dexie.minKey, config.database.nullReplacementNumber],
        [
          userId,
          config.database.nullReplacementDate,
          config.database.nullReplacementNumber,
        ],
        true,
        false
      )
      .sortBy("czech");

    return result;
  }

  /**
   * Resets all user items for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns number of reset items.
   * @throws error if operation fails.
   */
  static async resetsAllUserItems(userId: UUID): Promise<number> {
    const count = await db.user_items
      .where("user_id")
      .equals(userId)
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

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
  static async resetGrammarItems(
    userId: UUID,
    grammarId: number
  ): Promise<number> {
    const count = await db.user_items
      .where("[user_id+started_at+grammar_id]")
      .between(
        [userId, Dexie.minKey, grammarId],
        [userId, config.database.nullReplacementDate, grammarId],
        true,
        false
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
  static async resetUserItemById(
    userId: UUID,
    itemId: number
  ): Promise<boolean> {
    const count = await db.user_items
      .where("[user_id+item_id]")
      .equals([userId, itemId])
      .modify((item: UserItemLocal) => {
        resetUserItem(item);
      });

    if (count === 0) {
      throw new Error(`No user items found for item ID ${itemId}.`);
    }

    triggerUserItemsUpdatedEvent(userId);
    return true;
  }

  /**
   * Synchronizes user items data between local IndexedDB and Supabase.
   * @param userId - The ID of the logged-in user.
   * @returns boolean indicating success.
   * @throws error if operation fails.
   */
  static async syncUserItemsData(userId: UUID): Promise<number> {
    // Step 1: Get the last synced date for the user_items table
    const lastSyncedAt = await Metadata.getSyncedDate(
      TableName.UserItems,
      userId
    );

    // Step 2: Fetch synced server time
    const { data: serverTimeResponse, error: serverTimeError } =
      await supabaseInstance.rpc("server_time");
    if (serverTimeError) {
      console.error(`Failed to fetch server time: ${serverTimeError.message}`);
    }
    const serverTime = serverTimeResponse || new Date().toISOString();

    // Step 3: Fetch all local user items from IndexedDB newer than last synced date
    const localUserItems: UserItemLocal[] = await db.user_items
      .where("[user_id+updated_at]")
      .between([userId, lastSyncedAt || Dexie.minKey], [userId, Dexie.maxKey])
      .toArray();

    const sqlUserItems = localUserItems.map(convertLocalToSQL);

    // Step 4: Call the RPC function to sync user items
    const { data: updatedUserItems, error: rpcError } =
      await supabaseInstance.rpc("sync_user_items", {
        user_id_input: userId,
        items: sqlUserItems,
        last_synced_at: lastSyncedAt,
      });

    if (rpcError) {
      throw new Error("Error syncing user_items with Supabase:", rpcError);
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
    if (toDelete.length > 0 || toUpsert.length > 0) {
      triggerUserItemsUpdatedEvent(userId);
    }
    await Metadata.markAsSynced(TableName.UserItems, serverTime, userId);

    return updatedUserItems.length;
  }
}
