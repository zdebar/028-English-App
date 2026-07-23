/**
 * Removes localStorage entries whose key contains a user id.
 *
 * @param userId User id substring to match in keys; empty values are ignored.
 */
export function clearAllLocalStorageForUser(userId: string): void {
  if (!userId) return;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.includes(userId)) {
      localStorage.removeItem(key);
    }
  }
}
