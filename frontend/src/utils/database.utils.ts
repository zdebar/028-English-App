import { db } from "@/database/models/db";
import type { UserItemLocal } from "@/types/local.types";
import type { UserItemSQL } from "@/types/data.types";

export function ensureUserLoggedIn() {
  if (!db.userId) {
    throw new Error("No user is logged in.");
  }
}

export function convertLocalToSQL(localItem: UserItemLocal): UserItemSQL {
  return {
    user_id: localItem.user_id,
    item_id: localItem.id,
    progress: localItem.progress,
    started_at: localItem.started_at,
    updated_at: localItem.updated_at,
    next_at: localItem.next_at,
    learned_at: localItem.learned_at,
    mastered_at: localItem.mastered_at,
  };
}
