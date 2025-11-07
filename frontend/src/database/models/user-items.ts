import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { UserItemLocal } from "@/types/local.types";
import config from "@/config/config";
import { getNextAt } from "@/utils/practice.utils";
import { sortOddEvenByProgress } from "@/utils/practice.utils";
import { db } from "@/database/models/db";
import { supabaseInstance } from "@/config/supabase.config";
import { convertLocalToSQL } from "@/utils/database.utils";
import { getTodayDate } from "@/utils/database.utils";
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

  static async getPracticeDeck(
    deckSize: number = config.deckSize
  ): Promise<UserItemLocal[]> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

      const items: UserItemLocal[] = await db.user_items
        .where("[user_id+mastered_at]")
        .equals([userId, config.nullReplacementDate])
        .filter(
          (item) =>
            item.next_at === config.nullReplacementDate ||
            item.next_at <= new Date(Date.now()).toISOString()
        )
        .sortBy("sequence");

      return sortOddEvenByProgress(items.slice(0, deckSize));
    } catch (error) {
      console.error("Error fetching practice deck:", error);
      return [];
    }
  }

  static async savePracticeDeck(items: UserItemLocal[]): Promise<void> {
    try {
      const currentDateTime = new Date(Date.now()).toISOString();
      const updatedItems = items.map((item) => {
        return {
          ...item,
          progress: item.progress,
          next_at: getNextAt(item.progress),
          started_at: item.started_at || currentDateTime,
          updated_at: currentDateTime,
          learned_at:
            item.learned_at === config.nullReplacementDate &&
            item.progress > config.learnedAtThreshold
              ? currentDateTime
              : item.learned_at,
          mastered_at:
            item.mastered_at === config.nullReplacementDate &&
            item.progress > config.masteredAtThreshold
              ? currentDateTime
              : item.mastered_at,
        };
      });

      await db.user_items.bulkPut(updatedItems);
    } catch (error) {
      console.error("Error saving practice deck:", error);
    }
  }

  static async getLearnedCounts(): Promise<{
    learnedToday: number | null;
    learned: number | null;
  }> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }
      const today = getTodayDate();

      const learned = await db.user_items
        .where("user_id")
        .equals(userId)
        .and(
          (item: UserItemLocal) =>
            item.learned_at !== config.nullReplacementDate
        )
        .count();

      const learnedToday = await db.user_items
        .where("user_id")
        .equals(userId)
        .and(
          (item: UserItemLocal) =>
            item.learned_at !== config.nullReplacementDate &&
            item.learned_at.startsWith(today)
        )
        .count();

      return { learnedToday, learned };
    } catch (error) {
      console.error("Error fetching learned counts:", error);
      return { learnedToday: null, learned: null };
    }
  }

  static async getUserStartedVocabulary(): Promise<UserItemLocal[]> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

      const result = await db.user_items
        .where("user_id")
        .equals(userId)
        // .and((item: UserItemLocal) => item.grammar_id === null)
        .sortBy("czech");
      return result.slice(0, 30);
    } catch (error) {
      console.error("Error fetching started vocabulary:", error);
      return [];
    }
  }

  static async clearAllUserItems(): Promise<void> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }
      console.log("Clearing user items for user:", userId);

      await db.user_items
        .where("user_id")
        .equals(userId)
        .modify((item: UserItemLocal) => {
          item.next_at = config.nullReplacementDate;
          item.mastered_at = config.nullReplacementDate;
          item.updated_at = config.nullReplacementDate;
          item.learned_at = config.nullReplacementDate;
          item.progress = 0;
          item.started_at = config.nullReplacementDate;
        });
    } catch (error) {
      console.error("Error clearing all user items:", error);
    }
  }

  static async clearGrammarItems(grammarId: number): Promise<void> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }
      console.log(
        `Clearing user items for user: ${userId} and grammar: ${grammarId}`
      );

      await db.user_items
        .where("user_id")
        .equals(userId)
        .and((item: UserItemLocal) => item.grammar_id === grammarId)
        .modify((item: UserItemLocal) => {
          item.next_at = config.nullReplacementDate;
          item.mastered_at = config.nullReplacementDate;
          item.updated_at = config.nullReplacementDate;
          item.learned_at = config.nullReplacementDate;
          item.progress = 0;
          item.started_at = config.nullReplacementDate;
        });
    } catch (error) {
      console.error("Error clearing grammar items:", error);
    }
  }

  static async clearUserItem(itemId: number): Promise<void> {
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
          item.next_at = config.nullReplacementDate;
          item.mastered_at = config.nullReplacementDate;
          item.updated_at = config.nullReplacementDate;
          item.learned_at = config.nullReplacementDate;
          item.progress = 0;
          item.started_at = config.nullReplacementDate;
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

  // Sync authenticated user scores with Supabase
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
          (item: UserItemLocal) =>
            item.started_at !== config.nullReplacementDate
        )
        .toArray();

      const filteredUserItems = localUserItems.filter(
        (item) => item.started_at !== config.nullReplacementDate
      );
      const sqlUserItems = filteredUserItems.map(convertLocalToSQL);

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
