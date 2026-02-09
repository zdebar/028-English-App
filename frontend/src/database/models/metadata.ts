import config from '@/config/config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { TableName } from '@/types/local.types';
import { Entity } from 'dexie';

/**
 * Represents metadata information for table synchronization in the application database.
 *
 * @method getSyncedDate - Retrieves the last synchronization date for a specific table and user.
 * @method markAsSynced - Marks a specific table as synced by updating or inserting a metadata record.
 * @method deleteSyncRow - Deletes a metadata row for a specific table and optional user.
 *
 * @extends Entity<AppDB>
 */
export default class Metadata extends Entity<AppDB> {
  id!: string;
  table_name!: TableName;
  synced_at?: string;
  user_id?: string | null;

  /**
   * Retrieves the last synchronization date for a specific table and user.
   *
   * @static
   * @param tableName The name of the table to retrieve the sync date for.
   * @param userId (Optional) The ID of the user. If not provided, the null replacement user ID from config is used.
   * @returns A promise that resolves to the ISO string of the last synced date.
   *          Returns the epoch start date from config if no sync date is found.
   */
  static async getSyncedAt(tableName: TableName, userId?: string | null): Promise<string> {
    const metadata = await db.metadata.get([
      tableName,
      userId ?? config.database.nullReplacementUserId,
    ]);
    return metadata?.synced_at ?? config.database.epochStartDate;
  }

  /**
   * Marks the specified table as synced by updating or inserting a metadata record with the given sync time.
   *
   * @param tableName - The name of the table to mark as synced.
   * @param syncTime - The ISO string representing the time of synchronization.
   * @param userId - (Optional) The user ID associated with the sync operation. If not provided, the null replacement user ID from config is used.
   * @returns A promise that resolves to `true` if the operation was successful, otherwise `false`.
   */
  static async markAsSynced(
    tableName: TableName,
    syncTime: string,
    userId?: string | null,
  ): Promise<boolean> {
    const putResult = await db.metadata.put({
      table_name: tableName,
      user_id: userId ?? config.database.nullReplacementUserId,
      synced_at: syncTime,
    });
    return !!putResult;
  }

  /**
   * Deletes a metadata row from the database for the specified table and optional user.
   *
   * @param tableName - The name of the table whose metadata row should be deleted.
   * @param userId - (Optional) The user ID associated with the metadata row. If not provided, the null replacement user ID from config is used.
   * @returns A promise that resolves to `true` if the deletion was successful.
   */
  static async deleteSyncRow(tableName: TableName, userId?: string | null): Promise<boolean> {
    await db.metadata.delete([tableName, userId ?? config.database.nullReplacementUserId]);
    return true;
  }
}
