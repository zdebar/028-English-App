import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { TableName } from '@/types/local.types';
import { generateMetadataId } from '../database.utils';

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
   * @param userId (Optional) The ID of the user. If not provided, null is used.
   * @throws Error, if the database operation fails.
   * @returns A promise that resolves to the ISO string of the last synced date.
   *          Returns '1970-01-01T00:00:00.000Z' if no sync date is found. (epoch start)
   */
  static async getSyncedAt(tableName: TableName, userId?: string | null): Promise<string> {
    const id = generateMetadataId(tableName, userId ?? null);
    const metadata = await db.metadata.get(id);
    return metadata?.synced_at ?? '1970-01-01T00:00:00.000Z'; // Default to epoch start if not found
  }

  /**
   * Marks the specified table as synced by updating or inserting a metadata record with the given sync time.
   *
   * @static
   * @param tableName - The name of the table to mark as synced.
   * @param syncTime - The ISO string representing the time of synchronization.
   * @param userId - (Optional) The user ID associated with the sync operation. If not provided, null is used.
   * @throws Error, if the database operation fails.
   * @returns A promise that resolves to `true` if the operation was successful, otherwise `false`.
   */
  static async markAsSynced(
    tableName: TableName,
    syncTime: string,
    userId?: string | null,
  ): Promise<boolean> {
    const id = generateMetadataId(tableName, userId ?? null);
    const putResult = await db.metadata.put({
      id,
      table_name: tableName,
      user_id: userId ?? null,
      synced_at: syncTime,
    });
    return !!putResult;
  }

  /**
   * Deletes a metadata row from the database for the specified table and optional user.
   *
   * @static
   * @param tableName - The name of the table whose metadata row should be deleted.
   * @param userId - (Optional) The user ID associated with the metadata row. If not provided, deletes the row for the table only.
   * @throws Error, if the database operation fails.
   * @returns A promise that resolves to `true` if the deletion was successful.
   */
  static async deleteSyncRow(tableName: TableName, userId?: string | null): Promise<boolean> {
    const id = generateMetadataId(tableName, userId ?? null);
    await db.metadata.delete(id);
    return true;
  }
}
