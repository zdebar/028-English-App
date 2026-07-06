import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import UserItem from '@/database/models/user-items';

/**
 * Returns today's local calendar date.
 *
 * @returns Date string formatted as YYYY-MM-DD using the runtime locale date in en-CA format.
 */
export function getTodayShortDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-CA');
}

/**
 * Converts a date string to the local calendar date used by app counters.
 *
 * @param date Date string accepted by Date; normally an ISO UTC timestamp from storage or sync.
 * @returns Local YYYY-MM-DD date string in en-CA format.
 */
export function getLocalDateFromUTC(date: string): string {
  const localDate = new Date(date);
  return localDate.toLocaleDateString('en-CA');
}

/**
 * Restores a saved practice deck snapshot after an interrupted session.
 *
 * @param userId User id used to build the practiceDeckProgress localStorage key.
 * @returns Resolves after a valid snapshot is saved and the localStorage entry is removed.
 * Invalid JSON is logged and removed without rethrowing.
 * @throws Error when userId is empty.
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


