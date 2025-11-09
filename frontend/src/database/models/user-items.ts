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
import { getUserId } from "@/utils/database.utils";

export default class UserItem extends Entity<AppDB> implements UserItemLocal {
  item_id!: number;
  user_id!: string;
  czech!: string;
  english!: string;
  pronunciation!: string;
  audio!: string | null;
  sequence!: number;
  grammar_id!: number | null;
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
   * @param deckSize number of items to include in the practice deck.
   * @returns array of UserItemLocal objects.
   */
  static async getPracticeDeck(
    deckSize: number = config.lesson.deckSize
  ): Promise<UserItemLocal[]> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

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
        return itemsWithNextAt;
      }

      // Query 2: Fetch remaining items with next_at === nullReplacementDate, sorted by sequence
      const remainingItems: UserItemLocal[] = await db.user_items
        .where("[user_id+mastered_at+next_at]")
        .equals([
          userId,
          UserItem.nullReplacementDate,
          this.nullReplacementDate,
        ])
        .limit(deckSize - itemsWithNextAt.length)
        .sortBy("sequence");

      // Combine the results
      const combinedItems = [...itemsWithNextAt, ...remainingItems];

      if (combinedItems.length < deckSize) {
        return [];
      }

      return sortOddEvenByProgress(combinedItems);
    } catch (error) {
      console.error("Error fetching practice deck:", error);
      return [];
    }
  }

  /**
   * Saves the practiced deck items to the database.
   * @param items array of already practiced UserItemLocal objects.
   */
  static async savePracticeDeck(items: UserItemLocal[]): Promise<void> {
    try {
      const currentDateTime = new Date(Date.now()).toISOString();
      const updatedItems = items.map((item) => {
        return {
          ...item,
          progress: item.progress,
          next_at: getNextAt(item.progress),
          started_at:
            item.started_at === this.nullReplacementDate
              ? currentDateTime
              : item.started_at,
          updated_at: currentDateTime,
          learned_at:
            item.learned_at === this.nullReplacementDate &&
            item.progress > config.progress.learnedAtThreshold
              ? currentDateTime
              : item.learned_at,
          mastered_at:
            item.mastered_at === this.nullReplacementDate &&
            item.progress > config.progress.masteredAtThreshold
              ? currentDateTime
              : item.mastered_at,
        };
      });

      await db.user_items.bulkPut(updatedItems);
    } catch (error) {
      console.error("Error saving practice deck:", error);
    }
  }

  /**
   * Fetches learned counts for the logged-in user.
   * @returns object containing learnedToday and learned counts.
   */
  static async getLearnedCounts(): Promise<{
    learnedToday: number;
    learned: number;
  }> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

      const today = getTodayShortDate();
      const items = await db.user_items
        .where("user_id")
        .equals(userId)
        .and(
          (item: UserItemLocal) => item.learned_at !== this.nullReplacementDate
        )
        .toArray();

      const learned = items.length;
      const learnedToday = items.filter((item) =>
        item.learned_at.startsWith(today)
      ).length;

      return { learnedToday, learned };
    } catch (error) {
      console.error("Error fetching learned counts:", error);
      return { learnedToday: 0, learned: 0 };
    }
  }

  /**
   * Fetches all started vocabulary items for the logged-in user.
   * @returns array of UserItemLocal objects.
   */
  static async getUserStartedVocabulary(): Promise<UserItemLocal[]> {
    try {
      const userId = await getUserId();

      if (!userId) {
        throw new Error("User is not logged in.");
      }

      const result = await db.user_items
        .where("user_id")
        .equals(userId)
        .and((item: UserItemLocal) => item.grammar_id === null)
        .sortBy("czech");

      return result;
    } catch (error) {
      console.error("Error fetching started vocabulary:", error);
      return [];
    }
  }

  /**
   * Resets all user items for the logged-in user.
   */
  static async resetsAllUserItems(): Promise<void> {
    try {
      const userId = await getUserId();

      if (!userId) {
        throw new Error("User is not logged in.");
      }

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
    } catch (error) {
      console.error("Error clearing all user items:", error);
    }
  }

  /**
   * Resets user items associated with a specific grammar ID.
   * @param grammarId - The grammar ID whose items should be cleared.
   * @returns void
   */
  static async resetGrammarItems(grammarId: number): Promise<void> {
    if (!grammarId || grammarId <= 0) {
      console.error("Invalid grammar ID provided.");
      return;
    }

    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

      await db.user_items
        .where("user_id")
        .equals(userId)
        .and((item: UserItemLocal) => item.grammar_id === grammarId)
        .modify((item: UserItemLocal) => {
          item.next_at = this.nullReplacementDate;
          item.mastered_at = this.nullReplacementDate;
          item.updated_at = this.nullReplacementDate;
          item.learned_at = this.nullReplacementDate;
          item.progress = 0;
          item.started_at = this.nullReplacementDate;
        });
    } catch (error) {
      console.error("Error clearing grammar items:", error);
    }
  }

  /**
   * Resets a specific user item by its ID.
   * @param itemId  - The ID of the user item to reset.
   */
  static async resetUserItemById(itemId: number): Promise<void> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }
      console.log(
        `Clearing user item for user: ${userId} and itemId: ${itemId}`
      );

      const modifiedCount = await db.user_items
        .where("id")
        .equals(itemId)
        .and((item: UserItemLocal) => item.user_id === userId)
        .modify((item: UserItemLocal) => {
          item.next_at = this.nullReplacementDate;
          item.mastered_at = this.nullReplacementDate;
          item.updated_at = this.nullReplacementDate;
          item.learned_at = this.nullReplacementDate;
          item.progress = 0;
          item.started_at = this.nullReplacementDate;
        });

      if (modifiedCount === 0) {
        console.warn(
          `No user item found for id: ${itemId} and user: ${userId}`
        );
      }
    } catch (error) {
      console.error("Error clearing user item:", error);
    }
  }

  /**
   * Synchronizes user items data between local IndexedDB and Supabase.
   * @returns void
   */
  static async syncUserItemsData(): Promise<void> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

      // Step 1: Fetch all local user scores from IndexedDB
      const localUserItems = await db.user_items
        .where("user_id")
        .equals(userId)
        .and(
          (item: UserItemLocal) => item.started_at !== this.nullReplacementDate
        )
        .toArray();

      const sqlUserItems = localUserItems.map(convertLocalToSQL);

      // Step 2: Send local scores to Supabase for updates
      const { error: upsertError } = await supabaseInstance
        .from("user_items")
        .upsert(sqlUserItems, { onConflict: "user_id, item_id" });

      if (upsertError) {
        console.error("Error updating user_items on Supabase:", upsertError);
        return;
      }

      // Step 3: Fetch updated scores from Supabase with SQL logic
      const { data: updatedUserItems, error: fetchError } =
        await supabaseInstance.rpc("get_user_items", {
          user_id_input: userId,
        });

      if (fetchError) {
        console.error(
          "Error fetching updated user_items from Supabase:",
          fetchError
        );
        return;
      }

      // Step 4: Update local IndexedDB with the fetched data
      await db.user_items.bulkPut(updatedUserItems);
    } catch (error) {
      console.error("Unexpected error during user_items sync:", error);
    }
  }
}
