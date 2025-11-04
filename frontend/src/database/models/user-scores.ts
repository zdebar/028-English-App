import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { UserScoreLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import { generateUserScoreId } from "@/utils/database.utils";
import { getTodayDate } from "@/utils/database.utils";

export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  id!: string;
  user_id!: string;
  date!: string;
  item_count!: number;

  // Fetch the latest records for the user
  static async getLatest(limit: number = 4): Promise<UserScoreLocal[]> {
    if (!db.userId) {
      throw new Error("No user is logged in.");
    }

    return await db.user_scores
      .where("user_id")
      .equals(db.userId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Increase item count for today by a specified number
  static async addItemCount(addCount: number): Promise<UserScoreLocal> {
    if (!db.userId) {
      throw new Error("No user is logged in.");
    }
    const today = getTodayDate();

    try {
      // Fetch the existing record for the user and today's date
      const key = generateUserScoreId(db.userId, today);
      const existingRecord = await db.user_scores.get(key);
      console.log("Existing record:", existingRecord);

      // Calculate the new item count
      const newItemCount = (existingRecord?.item_count || 0) + addCount;

      // Create a new record or update the existing one
      const newRecord: UserScoreLocal = {
        id: existingRecord?.id || generateUserScoreId(db.userId, today),
        user_id: existingRecord?.user_id || db.userId,
        date: today,
        item_count: newItemCount,
      };

      // Save the new record to IndexedDB
      console.log("Saving new record:", newRecord);
      await db.user_scores.put(newRecord);

      // Return the updated record
      return newRecord;
    } catch (error) {
      console.error("Error updating item count:", error);
      throw error;
    }
  }

  static async getUserScoreForToday(): Promise<UserScoreLocal | undefined> {
    if (!db.userId) {
      throw new Error("No user is logged in.");
    }
    const today = getTodayDate();
    const key = generateUserScoreId(db.userId, today);
    return await db.user_scores.get(key);
  }

  // Sync authenticated user scores with Supabase
  static async syncUserScoreData(): Promise<void> {
    try {
      if (!db.userId) {
        throw new Error("No user is logged in.");
      }

      // Step 1: Fetch all local user scores
      const localScores = await db.user_scores
        .where("user_id")
        .equals(db.userId)
        .toArray();

      const scoresToSend = localScores.map(({ id, ...rest }) => {
        void id;
        return rest;
      });

      // Step 2: Send local scores to Supabase for updates
      const { error: upsertError } = await supabaseInstance
        .from("user_score")
        .upsert(scoresToSend, { onConflict: "user_id, date" });

      if (upsertError) {
        console.error("Error updating user scores on Supabase:", upsertError);
        return;
      }

      // Step 3: Fetch updated scores from Supabase
      const { data: updatedScores, error: fetchError } = await supabaseInstance
        .from("user_score")
        .select("user_id, date, item_count")
        .eq("user_id", db.userId);

      if (fetchError) {
        console.error(
          "Error fetching updated user scores from Supabase:",
          fetchError
        );
        return;
      }

      // Step 4: Rewrite local database with updated scores
      if (updatedScores) {
        const scoresWithId = updatedScores.map((score) => ({
          ...score,
          id: generateUserScoreId(score.user_id, score.date),
        }));
        await db.user_scores.bulkPut(scoresWithId);
      }
    } catch (error) {
      console.error("Unexpected error during user score sync:", error);
    }
  }
}
