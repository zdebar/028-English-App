import type { UserItemLocal } from "@/types/local.types";
import type { UserItemSQL } from "@/types/data.types";
import { supabaseInstance } from "@/config/supabase.config";
import config from "@/config/config";

export async function getUserId(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabaseInstance.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error("Error fetching user session:", error);
    return null;
  }
}

export async function getUserEmail(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabaseInstance.auth.getSession();
    return session?.user?.email || null;
  } catch (error) {
    console.error("Error fetching user session:", error);
    return null;
  }
}

export function convertLocalToSQL(localItem: UserItemLocal): UserItemSQL {
  const {
    user_id,
    item_id,
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
    started_at: started_at === config.nullReplacementDate ? null : started_at,
    updated_at: updated_at === config.nullReplacementDate ? null : updated_at,
    next_at: next_at === config.nullReplacementDate ? null : next_at,
    learned_at: learned_at === config.nullReplacementDate ? null : learned_at,
    mastered_at:
      mastered_at === config.nullReplacementDate ? null : mastered_at,
  };
}

/**
 * Generates a composite ID from user_id and date.
 * @param userId - The user ID.
 * @param date - The date in YYYY-MM-DD format.
 * @returns The composite ID.
 */
export function generateUserScoreId(userId: string, date: string): string {
  return `${userId}-${date}`;
}

/**
 * Returns today's date in YYYY-MM-DD format.
 * @returns {string} The current date in YYYY-MM-DD format.
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
