/**
 * Clears all application storage, including localStorage, sessionStorage, IndexedDB, and Cache Storage.
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
 * Clears any localStorage entries that contain the given userId in their key.
 * Safeguards against empty or falsy userId.
 * @param userId - The user id to match in localStorage keys
 */
export function clearAllLocalStorageForUser(userId: string): void {
  if (!userId) return;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.includes(userId)) {
      localStorage.removeItem(key);
    }
  }
}
