import { db } from "@/database/models/db";
import type { UserItemLocal } from "@/types/local.types";
import type { UserItemSQL } from "@/types/data.types";

export function ensureUserLoggedIn() {
  if (!db.userId) {
    throw new Error("No user is logged in.");
  }
}

export function convertLocalToSQL(localItem: UserItemLocal): UserItemSQL {
  const {
    user_id,
    id: item_id,
    progress,
    started_at,
    updated_at,
    next_at,
    learned_at,
    mastered_at,
  } = localItem;

  return {
    user_id,
    item_id,
    progress,
    started_at,
    updated_at,
    next_at,
    learned_at,
    mastered_at,
  };
}
