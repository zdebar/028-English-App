import AppDB from '@/database/models/app-db';

/**
 * Singleton instance of the application IndexedDB wrapper (`AppDB`).
 *
 * Import `db` from this module when accessing Dexie tables in the frontend.
 */
export const db = new AppDB();
