import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { UserScoreLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import { generateUserScoreId } from "@/utils/database.utils";
import { getTodayShortDate } from "@/utils/database.utils";
import {
  validatePositiveInteger,
  validateUUID,
} from "@/utils/validation.utils";

export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  id!: string;
  user_id!: string;
  date!: string;
  item_count!: number;

  /**
   * Increases the item count for today's date by the specified amount.
   * @param userId - The user ID. Must be a valid UUID.
   * @param addCount - The number to add to today's item count.
   * @returns - True if the operation was successful, false otherwise.
   */
  static async addItemCount(
    userId: string,
    addCount: number
  ): Promise<boolean> {
    validatePositiveInteger(addCount, "addCount");
    validateUUID(userId, "userId");

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
    return true;
  }

  /**
   * Fetches the user score record for today's date.
   * @param userId - The user ID. Must be a valid UUID.
   * @returns The user score record for today, or a new record with item_count 0 if none exists.
   */
  static async getUserScoreForToday(
    userId: string
  ): Promise<UserScoreLocal | undefined> {
    validateUUID(userId, "userId");

    const today = getTodayShortDate();
    const key = generateUserScoreId(userId, today);

    return (
      (await db.user_scores.get(key)) || {
        id: key,
        user_id: userId,
        date: today,
        item_count: 0,
      }
    );
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase.
   * @param userId - The user ID. Must be a valid UUID.
   * @returns
   */
  static async syncUserScoreData(userId: string): Promise<void> {
    validateUUID(userId, "userId");

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
      const scoresWithId = updatedScores.map((score) => ({
        ...score,
        id: generateUserScoreId(score.user_id, score.date),
      }));
      await db.user_scores.bulkPut(scoresWithId);
    }
  }
}
