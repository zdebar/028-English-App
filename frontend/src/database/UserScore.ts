import { Entity } from "dexie";
import type AppDB from "@/database/AppDB";
import type { UserScoreLocal } from "@/types/local.types";

export default class UserScore extends Entity<AppDB> implements UserScoreLocal {
  user_id!: number;
  date!: string;
  item_count!: number;

  // Fetch a single record by ID
  async getAll() {
    return await this.db.user_items
      .where("user_id")
      .equals(this.user_id)
      .reverse()
      .toArray();
  }

  // Fetch the latest 10 records for the user
  async getLatest(limit: number = 10) {
    return await this.db.user_items
      .where("user_id")
      .equals(this.user_id)
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Save or update itemCount
  static async saveItemCount(db: AppDB, itemCount: number, user_id: number) {
    const today = new Date().toISOString().split("T")[0];

    const existingRecord = await db.user_scores.get([user_id, today]);
    const newItemCount = (existingRecord?.item_count || 0) + itemCount;
    const newRecord: UserScoreLocal = {
      user_id,
      date: today,
      item_count: newItemCount,
    };
    return await db.user_scores.put(newRecord);
  }
}
