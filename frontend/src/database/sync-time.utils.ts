const FULL_SYNC_KEY_PREFIX = 'last-full-sync-at_';
const PARTIAL_SYNC_KEY_PREFIX = 'last-partial-sync-at_';

/**
 * Generates a full synchronization key for a given user.
 * @param userId - The unique identifier of the user.
 * @returns A concatenated string combining the full sync key prefix with the user ID.
 */
export function getFullSyncKey(userId: string): string {
  return `${FULL_SYNC_KEY_PREFIX}${userId}`;
}

/**
 * Generates a partial synchronization key for a given user.
 * @param userId - The unique identifier of the user.
 * @returns A formatted partial sync key combining a prefix and the user ID.
 */
export function getPartialSyncKey(userId: string): string {
  return `${PARTIAL_SYNC_KEY_PREFIX}${userId}`;
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
 * Saves the partial sync time for a specific user to local storage.
 * @param userId - The unique identifier of the user
 * @param time - The sync time value (in milliseconds) to save
 */
export function setPartialSyncTime(userId: string, time: number): void {
  localStorage.setItem(getPartialSyncKey(userId), String(time));
}

/**
 * Retrieves the partial synchronization time for a specific user from local storage.
 * @param userId - The unique identifier of the user.
 * @returns The partial sync time as a number, or 0 if not found in local storage.
 */
export function getPartialSyncTime(userId: string): number {
  return Number(localStorage.getItem(getPartialSyncKey(userId)) || 0);
}

/**
 * Clears all sync time records for a specific user from local storage.
 * @param userId - The unique identifier of the user whose sync times should be cleared.
 * @returns void
 */
export function clearSyncTimes(userId: string): void {
  localStorage.removeItem(getFullSyncKey(userId));
  localStorage.removeItem(getPartialSyncKey(userId));
}
