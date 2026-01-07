import type { UserItemLocal } from '@/types/local.types';
import type { UserItemSQL } from '@/types/data.types';
import { supabaseInstance } from '@/config/supabase.config';
import config from '@/config/config';
import type { TableName } from '@/types/local.types';

/**
 * Converts a local user item to SQL format, replacing null replacement dates with null.
 * @param localItem Item in format suitable for IndexedDB.
 * @returns Item in format suitable or PostgreSQL.
 */
export function convertLocalToSQL(localItem: UserItemLocal): UserItemSQL {
  const { user_id, item_id, progress, started_at, updated_at, next_at, mastered_at } = localItem;

  const nullReplacementDate = config.database.nullReplacementDate;

  return {
    user_id,
    item_id,
    progress,
    started_at: started_at === nullReplacementDate ? null : started_at,
    updated_at,
    next_at: next_at === nullReplacementDate ? null : next_at,
    mastered_at: mastered_at === nullReplacementDate ? null : mastered_at,
  };
}

/**
 * Generates a composite ID from user_id and date.
 * @param userId - The user ID.
 * @param date - The date in YYYY-MM-DD format.
 * @returns The composite ID from userId and date.
 * @throws Error if inputs are invalid.
 */
export function generateUserScoreId(userId: string, date: string): string {
  return `${userId}-${date}`;
}

/**
 * Generates a composite ID from user_id and date.
 * @param userId - The user ID.
 * @param date - The date in YYYY-MM-DD format.
 * @returns The composite ID from userId and date.
 * @throws Error if inputs are invalid.
 */
export function generateMetadataId(table_name: TableName, userId: string): string {
  return `${table_name}-${userId}`;
}

/**
 * Returns today's date in YYYY-MM-DD format.
 * @returns {string} The current date in YYYY-MM-DD format.
 */
export function getTodayShortDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-CA');
}

/**
 * Returns a date string converted to local time string.
 * @param date
 * @returns
 */
export function getLocalDateFromUTC(date: string): string {
  const localDate = new Date(date);
  return localDate.toLocaleDateString('en-CA');
}

/**
 * Fetches a file from Supabase storage bucket.
 * @param bucketName name of the storage bucket
 * @param dataFile name of the file to fetch
 * @returns blob data or null
 * @throws error if fetching fails, if inputs are invalid
 */
export async function fetchStorage(bucketName: string, dataFile: string): Promise<Blob | null> {
  const cacheBuster = `?t=${Date.now()}`;
  const filePath = dataFile.replace(/^\//, '') + cacheBuster;

  const { data, error } = await supabaseInstance.storage.from(bucketName).download(filePath);

  if (error) {
    console.error('Error fetching data:', error.message);
    return null;
  }

  return data;
}

/**
 * Triggers a custom named event.
 * @param userId
 * @param eventName
 * @returns
 */
export function triggerNamedEvent(eventName: string, userId: string) {
  if (!userId) return;
  const event = new CustomEvent(eventName, { detail: { userId } });
  window.dispatchEvent(event);
}

/**
 * Triggers a custom event indicating that user items have been updated.
 * @param userId
 * @param eventName
 * @returns
 */
export function triggerUserItemsUpdatedEvent(userId: string) {
  triggerNamedEvent('userItemsUpdated', userId);
}

/**
 * Resets a user item to its initial state.
 * @param item
 */
export function resetUserItem(item: UserItemLocal): void {
  item.started_at = config.database.nullReplacementDate;
  item.next_at = config.database.nullReplacementDate;
  item.mastered_at = config.database.nullReplacementDate;
  item.updated_at = new Date().toISOString();
  item.progress = 0;
}

/**
 * Returns the next review date based on the user's progress with randomness.
 * @param progress Item's progress.
 * @returns Date string in ISO format for the next review.
 * @throws Error if progress is not a positive integer.
 */
export function getNextAt(progress: number): string {
  const interval = config.srs.intervals[progress];
  if (interval == null) return config.database.nullReplacementDate;

  const randomFactor = 1 + config.srs.randomness * (Math.random() * 2 - 1);
  const randomizedInterval = Math.round(interval * randomFactor);
  const nextDate = new Date(Date.now() + randomizedInterval * 1000);
  return nextDate.toISOString();
}

/**
 * Sorts practice items by odd progress first.
 * @param items Array of UserItemLocal to be sorted.
 * @returns Sorted array of UserItemLocal.
 * @throws Error if items array is invalid.
 */
export function sortOddEvenByProgress(items: UserItemLocal[]): UserItemLocal[] {
  return items.sort((a, b) => {
    // Sort by odd progress first
    const oddA = a.progress % 2;
    const oddB = b.progress % 2;
    if (oddA !== oddB) return oddB - oddA;

    // Sort by sequence (ascending)
    return a.sequence - b.sequence;
  });
}
