import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import { errorHandler } from '@/features/logging/error-handler';
import type { UserItemSQL } from '@/types/data.types';
import type { UserItemLocal } from '@/types/local.types';
import UserItem from './models/user-items';
import { infoHandler } from '@/features/logging/info-handler';
import { SupabaseError } from '@/types/error.types';

/**
 * Converts a `UserItemLocal` object to a `UserItemSQL` object, replacing specific date fields
 * with `null` if they match the configured `nullReplacementDate`.
 *
 * @param localItem - The local user item to convert.
 * @returns The converted user item suitable for SQL storage.
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
 * Returns today's date in YYYY-MM-DD format.
 *
 * @returns The current date in YYYY-MM-DD format.
 */
export function getTodayShortDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-CA');
}

/**
 * Converts a UTC date string to a local date string formatted as 'YYYY-MM-DD'.
 *
 * @param date - The UTC date string to convert.
 * @returns The local date string in 'en-CA' format ('YYYY-MM-DD').
 */
export function getLocalDateFromUTC(date: string): string {
  const localDate = new Date(date);
  return localDate.toLocaleDateString('en-CA');
}

/**
 * Fetches a file from Supabase storage bucket.
 *
 * @param bucketName name of the storage bucket
 * @param dataFile name of the file to fetch
 * @returns Blob data or null on missing/error
 */
export async function fetchStorage(bucketName: string, dataFile: string): Promise<Blob> {
  const cacheBuster = `?t=${Date.now()}`;
  const filePath = dataFile.replace(/^\//, '') + cacheBuster;

  const { data, error } = await supabaseInstance.storage.from(bucketName).download(filePath);

  if (error || !data) {
    throw new SupabaseError(
      `Error fetching file ${dataFile} from bucket ${bucketName}: ${error?.message || 'No data returned'}`,
    );
  }

  return data;
}

/**
 * Triggers a custom DOM event with the specified name and attaches the user ID as event detail.
 *
 * @param eventName - The name of the custom event to trigger.
 * @param userId - The ID of the user to include in the event detail. If falsy, the event is not triggered.
 * @throws Error if userId is not provided.
 */
export function triggerNamedEvent(eventName: string, userId: string) {
  if (!userId) throw new Error('User ID is required to trigger event.');
  const event = new CustomEvent(eventName, { detail: { userId } });
  window.dispatchEvent(event);
}

/**
 * Triggers the 'userItemsUpdated' event for a specific user.
 *
 * @param userId - The unique user identifier.
 */
export function triggerUserItemsUpdatedEvent(userId: string) {
  triggerNamedEvent('userItemsUpdated', userId);
}

/**
 * Resets the properties of a given `UserItemLocal` object to their initial state.
 *
 * - Sets `started_at`, `next_at`, and `mastered_at` to the configured null replacement date.
 * - Updates `updated_at` to the current ISO timestamp.
 * - Resets `progress` to 0.
 *
 * @param item - The user item object to reset.
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

/**
 * Restores unsaved practice deck progress from local storage and saves it to the database.
 *
 * @param userId - The ID of the user whose progress should be restored
 * @returns A promise that resolves when the restore operation is complete
 * @throws Does not throw; errors are handled internally and logged via errorHandler
 */
export async function restoreUnsavedFromLocalStorage(userId: string): Promise<void> {
  const key = `practiceDeckProgress_${userId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const userProgress = JSON.parse(saved);
      if (Array.isArray(userProgress) && userProgress.length > 0) {
        UserItem.savePracticeDeck(userId, userProgress);
      }
      localStorage.removeItem(key);
      infoHandler(
        `Restored unsaved practice deck progress for user ${userId} with ${userProgress.length} items.`,
      );
    } catch (e) {
      errorHandler('Error parsing practice deck progress from localStorage', e);
      localStorage.removeItem(key);
    }
  }
}
