import type AppDB from '@/database/models/app-db';
import { supabaseInstance } from '@/config/supabase.config';
import { db } from '@/database/models/db';
import Metadata from '@/database/models/metadata';
import { getSyncTimestamps, splitDeleted } from '@/database/utils/sync-generic.utils';
import { SupabaseError } from '@/types/error.types';
import type { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';

type SyncRow = { id: number; deleted_at: string | null };

interface SyncEntityModelStatic<T extends SyncRow> {
  syncTable: Dexie.Table<T, number>;
  syncTableName: TableName;
  syncEntityName: string;
  syncSelect: string;
}

/**
 * Base model for shared lookup tables synced from Supabase into IndexedDB.
 *
 * Subclasses provide the table, table name, entity label, and select list. The shared
 * `syncFromRemote` implementation handles full/incremental pulls, tombstones, and metadata updates.
 */
export default abstract class SyncEntityModel extends Entity<AppDB> {
  static readonly syncTable: Dexie.Table<SyncRow, number>;
  static readonly syncTableName: TableName;
  static readonly syncEntityName: string;
  static readonly syncSelect: string;

  /**
   * Synchronizes a shared lookup table from Supabase into IndexedDB.
   *
   * @param doFullSync When true, clears the local table before applying remote rows from the epoch.
   * Defaults to false for incremental sync using stored metadata.
   * @returns Number of remote rows returned by the query, including tombstones.
   * @throws SupabaseError when the remote select fails.
   * @throws Error when metadata validation fails.
   */
  static async syncFromRemote<T extends SyncRow>(
    this: SyncEntityModelStatic<T>,
    doFullSync: boolean = false,
  ): Promise<number> {
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(doFullSync, this.syncTableName);
    const { data, error } = await supabaseInstance
      .from(this.syncTableName)
      .select(this.syncSelect)
      .gt('updated_at', lastSyncedAt);

    if (error) {
      throw new SupabaseError(`Failed to fetch ${this.syncEntityName} data from supabase`, error, {
        lastSyncedAt,
      });
    }

    const remoteItems = (data as unknown as T[] | null) ?? [];
    const { toUpsert, toDelete } = splitDeleted(remoteItems);

    await db.transaction('rw', this.syncTable, db.metadata, async () => {
      if (doFullSync) {
        await this.syncTable.clear();
      } else if (toDelete.length > 0) {
        await this.syncTable.bulkDelete(toDelete.map((item) => item.id));
      }
      if (toUpsert.length > 0) {
        await this.syncTable.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(this.syncTableName, newSyncedAt);
    });

    return remoteItems.length;
  }
}
