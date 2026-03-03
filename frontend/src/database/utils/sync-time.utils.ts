const FULL_SYNC_KEY_PREFIX = 'last-full-sync-at_';

/**
 * Generates a full synchronization key for a given user.
 * @param userId - The unique identifier of the user.
 * @returns A concatenated string combining the full sync key prefix with the user ID.
 */
export function getFullSyncKey(userId: string): string {
  return `${FULL_SYNC_KEY_PREFIX}${userId}`;
}

/**
 * Saves the full synchronization time for a user to localStorage.
 * @param userId - The unique identifier of the user
 * @param time - The synchronization timestamp (in milliseconds) to be saved
 */
export function setFullSyncTime(userId: string, time: number): void {
  localStorage.setItem(getFullSyncKey(userId), String(time));
}

/**
 * Retrieves the full synchronization time for a specific user.
 * @param userId - The unique identifier of the user.
 * @returns The full sync time as a number (in milliseconds). Returns 0 if no sync time is stored.
 */
export function getFullSyncTime(userId: string): number {
  return Number(localStorage.getItem(getFullSyncKey(userId)) || 0);
}

/**
 * Clears all sync time records for a specific user from local storage.
 * @param userId - The unique identifier of the user whose sync times should be cleared.
 * @returns void
 */
export function clearSyncTimes(userId: string): void {
  localStorage.removeItem(getFullSyncKey(userId));
}
