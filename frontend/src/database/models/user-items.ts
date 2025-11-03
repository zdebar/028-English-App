import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { UserItemLocal } from "@/types/local.types";
import config from "@/config/config";
import { getNextAt } from "@/utils/practice.utils";
import { sortOddEvenByProgress } from "@/utils/practice.utils";
import { db } from "@/database/models/db";
import { supabaseInstance } from "@/config/supabase.config";
import { convertLocalToSQL } from "@/utils/database.utils";

export default class UserItem extends Entity<AppDB> implements UserItemLocal {
  id!: number;
  user_id!: string;
  czech!: string;
  english!: string;
  pronunciation!: string;
  audio!: string | null;
  sequence!: number;
  grammar_id!: number | null;
  progress!: number;
  started_at!: string | null;
  updated_at!: string | null;
  next_at!: string;
  learned_at!: string | null;
  mastered_at!: string;

  static async getPracticeDeck(limit: number = config.deckSize) {
    if (!db.userId) {
      throw new Error("No user is logged in.");
    }

    const items: UserItemLocal[] = await db.user_items
      .where("user_id")
      .equals(db.userId!)
      .and(
        (item: UserItemLocal) => item.mastered_at === config.nullReplacementDate
      )
      .and(
        (item: UserItemLocal) =>
          item.next_at === config.nullReplacementDate ||
          item.next_at <= new Date(Date.now()).toISOString()
      )
      .sortBy("next_at")
      .then((items: UserItemLocal[]) =>
        items.sort((a, b) => a.sequence - b.sequence)
      );

    return sortOddEvenByProgress(items.slice(0, limit));
  }

  static async savePracticeDeck(items: UserItemLocal[]) {
    const currentDateTime = new Date(Date.now()).toISOString();
    const updatedItems = items.map((item) => {
      return {
        ...item,
        progress: item.progress,
        next_at: getNextAt(item.progress),
        started_at: item.started_at || currentDateTime,
        updated_at: currentDateTime,
        learned_at:
          !item.learned_at && item.progress > config.learnedAtThreshold
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
  }

  // Sync authenticated user scores with Supabase
  static async syncUserItemsData(): Promise<void> {
    try {
      if (!db.userId) {
        throw new Error("No user is logged in.");
      }

      // Step 1: Fetch all local user scores from IndexedDB
      const localUserItems = await db.user_items
        .where("user_id")
        .equals(db.userId)
        .and((item: UserItemLocal) => item.started_at !== null)
        .toArray();

      console.log(
        `Syncing ${localUserItems.length} user items for user ID: ${db.userId}`
      );

      const filteredUserItems = localUserItems.filter(
        (item) => item.started_at !== null
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
        await supabaseInstance.rpc("get_user_items");

      if (fetchError) {
        console.error(
          "Error fetching updated user_items from Supabase:",
          fetchError
        );
        return;
      }

      console.log(
        `Fetched ${
          updatedUserItems?.length || 0
        } updated user items from Supabase.`
      );

      // Step 4: Update local IndexedDB with the fetched data
      await db.user_scores.bulkPut(updatedUserItems);
      console.log("User_items synced successfully!");
    } catch (error) {
      console.error("Unexpected error during user_items sync:", error);
    }
  }
}
