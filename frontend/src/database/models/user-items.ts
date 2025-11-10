import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { UserItemLocal } from "@/types/local.types";
import config from "@/config/config";
import { getNextAt } from "@/utils/practice.utils";
import { sortOddEvenByProgress } from "@/utils/practice.utils";
import { db } from "@/database/models/db";
import { supabaseInstance } from "@/config/supabase.config";
import { convertLocalToSQL } from "@/utils/database.utils";
import { getTodayShortDate } from "@/utils/database.utils";
import Dexie from "dexie";
import {
  validatePositiveInteger,
  validateUserItemArray,
  validateUUID,
} from "@/utils/validation.utils";

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
  next_at!: string;
  learned_at!: string;
  mastered_at!: string;

  static readonly nullReplacementDate: string =
    config.database.nullReplacementDate;

  /**
   * Gets a practice deck of user items for the logged-in user.
   * @param userId the ID of the logged-in user.
   * @param deckSize number of items to include in the practice deck.
   * @returns array of UserItemLocal objects.
   */
  static async getPracticeDeck(
    userId: string,
    deckSize: number = config.lesson.deckSize
  ): Promise<UserItemLocal[]> {
    validatePositiveInteger(deckSize, "deckSize");
    validateUUID(userId, "userId");

    const now = new Date().toISOString();

    // Query 1: Fetch items with next_at older than now, sorted by next_at
    const itemsWithNextAt: UserItemLocal[] = await db.user_items
      .where("[user_id+mastered_at+next_at]")
      .between(
        [userId, UserItem.nullReplacementDate, "0000-01-01T00:00:00.000Z"],
        [userId, UserItem.nullReplacementDate, now]
      )
      .limit(deckSize)
      .toArray();

    // If we already have enough items, return them
    if (itemsWithNextAt.length >= deckSize) {
      return sortOddEvenByProgress(itemsWithNextAt);
    }

    // Query 2: Fetch remaining items with next_at === nullReplacementDate, sorted by sequence
    const remainingItems: UserItemLocal[] = await db.user_items
      .where("[user_id+mastered_at+next_at]")
      .equals([
        userId,
        UserItem.nullReplacementDate,
        UserItem.nullReplacementDate,
      ])
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
   */
  static async savePracticeDeck(items: UserItemLocal[]): Promise<boolean> {
    validateUserItemArray(items);

    const currentDateTime = new Date(Date.now()).toISOString();
    const updatedItems = items.map((item) => {
      return {
        ...item,
        progress: item.progress,
        next_at: getNextAt(item.progress),
        started_at:
          item.started_at === UserItem.nullReplacementDate
            ? currentDateTime
            : item.started_at,
        updated_at: currentDateTime,
        learned_at:
          item.learned_at === UserItem.nullReplacementDate &&
          item.progress > config.progress.learnedAtThreshold
            ? currentDateTime
            : item.learned_at,
        mastered_at:
          item.mastered_at === UserItem.nullReplacementDate &&
          item.progress > config.progress.masteredAtThreshold
            ? currentDateTime
            : item.mastered_at,
      };
    });

    await db.user_items.bulkPut(updatedItems);
    return true;
  }

  /**
   * Fetches learned counts for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns object containing learnedCountToday and learnedCount.
   */
  static async getLearnedCounts(userId: string): Promise<{
    learnedCountToday: number;
    learnedCount: number;
  }> {
    validateUUID(userId, "userId");

    const today = getTodayShortDate();
    const learnedItems = await db.user_items
      .where("[user_id+learned_at]")
      .between(
        [userId, Dexie.minKey],
        [userId, UserItem.nullReplacementDate],
        true,
        false
      )
      .toArray();

    const learnedCount = learnedItems.length;
    const learnedCountToday = learnedItems.filter((item) =>
      item.learned_at.startsWith(today)
    ).length;

    return { learnedCountToday, learnedCount };
  }

  /**
   * Fetches all started vocabulary items for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns array of UserItemLocal objects.
   */
  static async getUserStartedVocabulary(
    userId: string
  ): Promise<UserItemLocal[]> {
    validateUUID(userId, "userId");

    const result = await db.user_items
      .where("[user_id+grammar_id]")
      .equals([userId, config.database.nullReplacementNumber])
      .sortBy("czech");

    return result;
  }

  /**
   * Resets all user items for the logged-in user.
   * @param userId - The ID of the logged-in user.
   * @returns boolean indicating success.
   */
  static async resetsAllUserItems(userId: string): Promise<boolean> {
    validateUUID(userId, "userId");

    await db.user_items
      .where("user_id")
      .equals(userId)
      .modify((item: UserItemLocal) => {
        item.next_at = this.nullReplacementDate;
        item.mastered_at = this.nullReplacementDate;
        item.updated_at = this.nullReplacementDate;
        item.learned_at = this.nullReplacementDate;
        item.progress = 0;
        item.started_at = this.nullReplacementDate;
      });
    return true;
  }

  /**
   * Resets user items associated with a specific grammar ID.
   * @param userId - The ID of the logged-in user.
   * @param grammarId - The grammar ID whose items should be cleared.
   * @returns void
   */
  static async resetGrammarItems(
    userId: string,
    grammarId: number
  ): Promise<void> {
    validatePositiveInteger(grammarId, "grammarId");
    validateUUID(userId, "userId");

    await db.user_items
      .where("[user_id+grammar_id]")
      .equals([userId, grammarId])
      .modify((item: UserItemLocal) => {
        item.next_at = this.nullReplacementDate;
        item.mastered_at = this.nullReplacementDate;
        item.updated_at = this.nullReplacementDate;
        item.learned_at = this.nullReplacementDate;
        item.progress = 0;
        item.started_at = this.nullReplacementDate;
      });
  }

  /**
   * Resets a specific user item by its ID.
   * @param userId - The ID of the logged-in user.
   * @param itemId  - The ID of the item to reset.
   * @returns boolean indicating success.
   */
  static async resetUserItemById(
    userId: string,
    itemId: number
  ): Promise<boolean> {
    validatePositiveInteger(itemId, "itemId");
    validateUUID(userId, "userId");

    await db.user_items
      .where("[user_id+item_id]")
      .equals([userId, itemId])
      .modify((item: UserItemLocal) => {
        item.next_at = this.nullReplacementDate;
        item.mastered_at = this.nullReplacementDate;
        item.updated_at = this.nullReplacementDate;
        item.learned_at = this.nullReplacementDate;
        item.progress = 0;
        item.started_at = this.nullReplacementDate;
      });

    return true;
  }

  /**
   * Synchronizes user items data between local IndexedDB and Supabase.
   * @param userId - The ID of the logged-in user.
   * @returns boolean indicating success.
   */
  static async syncUserItemsData(userId: string): Promise<boolean> {
    validateUUID(userId, "userId");

    // Step 1: Fetch all local user items from IndexedDB
    const localUserItems = await db.user_items
      .where("[user_id+started_at]")
      .between(
        [userId, Dexie.minKey],
        [userId, this.nullReplacementDate],
        true,
        false
      )
      .toArray();

    const sqlUserItems = localUserItems.map(convertLocalToSQL);

    // Step 2: Send local items to Supabase for updates
    const { error: upsertError } = await supabaseInstance
      .from("user_items")
      .upsert(sqlUserItems, { onConflict: "user_id, item_id" });

    if (upsertError) {
      console.error("Error updating user_items on Supabase:", upsertError);
      return false;
    }

    // Step 3: Fetch updated items from Supabase with SQL logic
    const { data: updatedUserItems, error: fetchError } =
      await supabaseInstance.rpc("get_user_items", {
        user_id_input: userId,
      });

    if (fetchError) {
      console.error(
        "Error fetching updated user_items from Supabase:",
        fetchError
      );
      return false;
    }

    // Step 4: Update local IndexedDB with the fetched data
    await db.user_items.bulkPut(updatedUserItems);
    return true;
  }
}
