import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { UserScoreLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import { generateUserScoreId } from "@/utils/database.utils";
import { getTodayShortDate } from "@/utils/database.utils";
import { getUserId } from "@/utils/database.utils";

export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  id!: string;
  user_id!: string;
  date!: string;
  item_count!: number;

  /**
   * Fetches the latest user scores for the logged-in user.
   * @param limit
   * @returns
   */
  static async getLatest(limit: number = 4): Promise<UserScoreLocal[]> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

      return await db.user_scores
        .where("user_id")
        .equals(userId)
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error("Error fetching latest user scores:", error);
      return [];
    }
  }

  /**
   * Increases the item count for today's date by the specified amount.
   * @param addCount
   * @returns
   */
  static async addItemCount(addCount: number): Promise<void> {
    if (!Number.isInteger(addCount) || addCount <= 0) {
      console.error("Invalid addCount value provided.");
      return;
    }

    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }
      const today = getTodayShortDate();

      // Fetch the existing record for the user and today's date
      const key = generateUserScoreId(userId, today);
      const existingRecord = await db.user_scores.get(key);

      // Calculate the new item count
      const newItemCount = (existingRecord?.item_count || 0) + addCount;

      // Create a new record or update the existing one
      const newRecord: UserScoreLocal = {
        id: existingRecord?.id || generateUserScoreId(userId, today),
        user_id: existingRecord?.user_id || userId,
        date: today,
        item_count: newItemCount,
      };

      // Save the new record to IndexedDB
      await db.user_scores.put(newRecord);
    } catch (error) {
      console.error("Error updating item count:", error);
    }
  }

  /**
   * Fetches the user score record for today's date.
   * @returns
   */
  static async getUserScoreForToday(): Promise<UserScoreLocal | undefined> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }
      const today = getTodayShortDate();
      const key = generateUserScoreId(userId, today);

      return await db.user_scores.get(key);
    } catch (error) {
      console.error("Error fetching user score for today:", error);
      return undefined;
    }
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase.
   * @returns
   */
  static async syncUserScoreData(): Promise<void> {
    try {
      const userId = await getUserId();
      if (!userId) {
        throw new Error("User is not logged in.");
      }

      // Step 1: Fetch all local user scores
      const localScores = await db.user_scores
        .where("user_id")
        .equals(userId)
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
        .eq("user_id", userId);

      if (fetchError) {
        console.error(
          "Error fetching updated user scores from Supabase:",
          fetchError
        );
        return;
      }

      // Step 4: Rewrite local database with updated scores
      if (updatedScores) {
        const validScores = updatedScores.filter(
          (score) =>
            score.user_id && score.date && Number.isInteger(score.item_count)
        );

        if (validScores.length !== updatedScores.length) {
          console.warn(
            `Filtered out ${
              updatedScores.length - validScores.length
            } invalid user scores.`
          );
        }

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
