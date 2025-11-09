import type { UserItemLocal } from "@/types/local.types";
import type { UserItemSQL } from "@/types/data.types";
import { supabaseInstance } from "@/config/supabase.config";
import config from "@/config/config";

/**
 * Check supabase session and return user ID if logged in.
 * @returns user UUID or null if not logged in.
 */
export async function getUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabaseInstance.auth.getSession();
  return session?.user?.id || null;
}

/**
 * Check supabase session and return user email if logged in.
 * @returns user email or null if not logged in.
 */
export async function getUserEmail(): Promise<string | null> {
  const {
    data: { session },
  } = await supabaseInstance.auth.getSession();
  return session?.user?.email || null;
}

/**
 * Converts a local user item to SQL format, replacing null replacement dates with null.
 * @param localItem Item in format suitable for IndexedDB.
 * @returns Item in format suitable or PostgreSQL.
 */
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
  const nullReplacementDate = config.database.nullReplacementDate;

  return {
    user_id,
    item_id,
    progress,
    started_at: started_at === nullReplacementDate ? null : started_at,
    updated_at: updated_at === nullReplacementDate ? null : updated_at,
    next_at: next_at === nullReplacementDate ? null : next_at,
    learned_at: learned_at === nullReplacementDate ? null : learned_at,
    mastered_at: mastered_at === nullReplacementDate ? null : mastered_at,
  };
}

/**
 * Generates a composite ID from user_id and date.
 * @param userId - The user ID.
 * @param date - The date in YYYY-MM-DD format.
 * @returns The composite ID from userId and date.
 */
export function generateUserScoreId(userId: string, date: string): string {
  return `${userId}-${date}`;
}

/**
 * Returns today's date in YYYY-MM-DD format.
 * @returns {string} The current date in YYYY-MM-DD format.
 */
export function getTodayShortDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Fetches a file from Supabase storage bucket.
 * @param bucketName name of the storage bucket
 * @param dataFile name of the file to fetch
 * @returns blob data or null
 * @throws error if fetching fails
 */
export async function fetchStorage(
  bucketName: string,
  dataFile: string
): Promise<Blob | null> {
  const cacheBuster = `?t=${Date.now()}`;
  const filePath = dataFile.replace(/^\//, "") + cacheBuster;

  const { data, error } = await supabaseInstance.storage
    .from(bucketName)
    .download(filePath);

  if (error) {
    console.error("Error fetching data:", error.message);
    return null;
  }

  return data;
}

/**
 * Returns a shortened date string (YYYY-MM-DD) from an ISO date string.
 * @param isoDate ISO date string
 * @returns Shortened date string or "není k dispozici" if date is undefined or null replacement date.
 */
export function shortenDate(isoDate: string | undefined): string {
  if (!isoDate || isoDate === config.database.nullReplacementDate)
    return "není k dispozici";
  return isoDate.split("T")[0];
}
