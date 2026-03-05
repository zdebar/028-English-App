import { supabaseInstance } from '@/config/supabase.config';
import { errorHandler } from '@/features/logging/error-handler';
import UserItem from '../models/user-items';
import { infoHandler } from '@/features/logging/info-handler';
import { SupabaseError } from '@/types/error.types';

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
  if (!bucketName) throw new Error('Bucket name is required');
  if (!dataFile) throw new Error('Data file name is required');

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
 * Restores unsaved practice deck progress from local storage and saves it to the database.
 *
 * @param userId - The ID of the user whose progress should be restored
 * @returns A promise that resolves when the restore operation is complete
 * @throws Does not throw; errors are handled internally and logged via errorHandler
 */
export async function restoreUnsavedFromLocalStorage(userId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required to restore unsaved progress from localStorage');

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
