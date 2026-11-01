const FULL_SYNC_KEY_PREFIX = 'last-full-sync-at_';

/**
 * Builds the localStorage key used to throttle full syncs for one user.
 *
 * @param userId User id appended to the full-sync key prefix.
 * @returns localStorage key for the user's last full sync timestamp.
 */
export function getFullSyncKey(userId: string): string {
  return `${FULL_SYNC_KEY_PREFIX}${userId}`;
}

/**
 * Stores the last full sync time for a user.
 *
 * @param userId User id whose sync timestamp should be stored.
 * @param time Non-negative finite timestamp in milliseconds.
 * @throws Error when time is negative, infinite, or NaN.
 */
export function setFullSyncTime(userId: string, time: number): void {
  if (!Number.isFinite(time) || time < 0) {
    throw new Error('time must be a non-negative finite number.');
  }
  localStorage.setItem(getFullSyncKey(userId), String(time));
}

/**
 * Reads the last full sync time for a user.
 *
 * @param userId User id whose sync timestamp should be read.
 * @returns Stored timestamp in milliseconds, or 0 when missing or invalid.
 */
export function getFullSyncTime(userId: string): number {
  const storedTime = localStorage.getItem(getFullSyncKey(userId));
  if (storedTime === null) return 0;

  const time = Number(storedTime);
  if (!Number.isFinite(time) || time < 0) return 0;

  return time;
}
