/**
 * Clears browser-side app state for the current origin.
 *
 * @returns Nothing; IndexedDB and Cache Storage deletion are started asynchronously and not awaited.
 */
export function clearAppStorage() {
  localStorage.clear();
  sessionStorage.clear();

  if (globalThis.indexedDB && indexedDB.databases) {
    indexedDB.databases().then((dbs) => {
      dbs.forEach((db) => indexedDB.deleteDatabase(db.name!));
    });
  }

  if ('caches' in globalThis) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}

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
