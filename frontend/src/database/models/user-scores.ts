import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import { TableName, type UserScoreLocal } from "@/types/local.types";
import { supabaseInstance } from "@/config/supabase.config";
import { db } from "@/database/models/db";
import { generateUserScoreId } from "@/utils/database.utils";
import { getTodayShortDate } from "@/utils/database.utils";
import type { UUID } from "crypto";
import Metadata from "./metadata";
import Dexie from "dexie";

export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  id!: string;
  user_id!: UUID;
  date!: string;
  item_count!: number;
  updated_at!: string;

  /**
   * Increases the item count for today's date by the specified amount.
   * @param userId - The user ID. Must be a valid UUID.
   * @param addCount - The number to add to today's item count.
   * @returns - True if the operation was successful, false otherwise.
   * @throws Error
   */
  static async addItemCount(userId: UUID, addCount: number): Promise<boolean> {
    try {
      const today = getTodayShortDate();

      // Fetch the existing record for the user and today's date
      const key = generateUserScoreId(userId, today);
      const existingRecord = await db.user_scores.get(key);

      // Calculate the new item count
      const newItemCount = (existingRecord?.item_count || 0) + addCount;

      // Create a new record or update the existing one
      const newRecord: UserScoreLocal = {
        id: existingRecord?.id || key,
        user_id: existingRecord?.user_id || userId,
        date: today,
        item_count: newItemCount,
        updated_at: new Date().toISOString(),
      };

      // Save the new record to IndexedDB
      await db.user_scores.put(newRecord);
      return true;
    } catch (error) {
      console.error("Error adding item count to user score:", error);
      return false;
    }
  }

  /**
   * Fetches the user score record for today's date.
   * @param userId - The user ID. Must be a valid UUID.
   * @returns The user score record for today, or a new record with item_count 0 if none exists.
   * @throws Error
   */
  static async getUserScoreForToday(userId: UUID): Promise<UserScoreLocal> {
    const today = getTodayShortDate();
    const key = generateUserScoreId(userId, today);

    return (
      (await db.user_scores.get(key)) || {
        id: key,
        user_id: userId,
        date: today,
        item_count: 0,
        updated_at: new Date().toISOString(),
      }
    );
  }

  /**
   * Synchronizes user score data between the local IndexedDB and Supabase.
   * @param userId - The user ID. Must be a valid UUID.
   * @returns The number of user score records synced.
   * @throws Error
   */
  static async syncUserScoreData(userId: UUID): Promise<number> {
    // Step 1: Get the last synced date for the user_scores table
    const lastSyncedAt = await Metadata.getSyncedDate(
      TableName.UserScores,
      userId
    );

    // Step 2: Get the current server time from Supabase
    const newSyncTime = new Date().toISOString();

    // Step 3: Gather local changes since the last sync
    const localScores = await db.user_scores
      .where("[user_id+updated_at]")
      .between([userId, lastSyncedAt], [userId, Dexie.maxKey], true, true)
      .toArray();

    // Step 3: Send local scores to Supabase for updates
    const { error: errorInsert } = await supabaseInstance.rpc(
      "upsert_user_scores",
      {
        scores: localScores,
      }
    );

    if (errorInsert) {
      throw new Error("Synchronization disallowed for annonymous users.");
    }

    // Step 4: Fetch updated records from supabase
    const { data: updatedScores, error: errorFetch } =
      await supabaseInstance.rpc("fetch_user_scores", {
        user_id_input: userId,
        last_synced_at: lastSyncedAt,
      });

    if (errorFetch) {
      throw new Error("Error fetching user scores from Supabase:", errorFetch);
    }

    // Step 5: Rewrite local database with updated scores
    if (updatedScores && updatedScores.length > 0) {
      const scoresWithId = updatedScores.map((score: UserScore) => ({
        ...score,
        id: generateUserScoreId(score.user_id, score.date),
      }));
      await db.user_scores.bulkPut(scoresWithId);
    }

    // Step 6: Update the metadata table with the new sync time
    await Metadata.markAsSynced(TableName.UserScores, newSyncTime, userId);
    return updatedScores.length;
  }
}
