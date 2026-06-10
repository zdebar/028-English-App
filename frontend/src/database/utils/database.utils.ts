import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import UserItem from '@/database/models/user-items';

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
      const parsed = JSON.parse(saved) as { progress?: unknown; dateTime?: string };
      const userProgress = Array.isArray(parsed.progress) ? parsed.progress : [];
      if (Array.isArray(userProgress) && userProgress.length > 0) {
        await UserItem.savePracticeDeck(userProgress, parsed.dateTime);
      }
      localStorage.removeItem(key);
      reportInfo(
        `Restored unsaved practice deck progress with ${userProgress.length} items.`,
      );
    } catch (e) {
      reportError('Error parsing practice deck progress from localStorage', e);
      localStorage.removeItem(key);
    }
  }
}


