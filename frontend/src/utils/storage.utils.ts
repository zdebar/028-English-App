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
