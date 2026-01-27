import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { TableName } from '@/types/local.types';
import { generateMetadataId } from '../database.utils';

export default class Metadata extends Entity<AppDB> {
  id!: string;
  table_name!: TableName;
  synced_at?: string;
  user_id?: string | 'placeholder';

  /**
   * Gets the last synced date for a table and user.
   * @param tableName the name of the table
   * @param userId the ID of the user (optional)
   * @returns the synced_at date or first epoch date if not found
   */
  static async getSyncedDate(tableName: TableName, userId?: string | null): Promise<string> {
    const id = generateMetadataId(tableName, userId ?? 'placeholder');
    const metadata = await db.metadata.get(id);
    return metadata?.synced_at ?? '1970-01-01T00:00:00.000Z';
  }

  /**
   * Marks a table as synced by storing its metadata.
   * @param tableName the name of the synced table
   * @param syncTime sync time (e.g., from the server)
   * @param userId the ID of the user (optional)
   * @returns true if the operation was successful
   */
  static async markAsSynced(
    tableName: TableName,
    syncTime: string,
    userId?: string | null,
  ): Promise<boolean> {
    const id = generateMetadataId(tableName, userId ?? 'placeholder');
    const putResult = await db.metadata.put({
      id,
      table_name: tableName,
      user_id: userId ?? 'placeholder',
      synced_at: syncTime,
    });
    return !!putResult;
  }

  /**
   * Deletes the sync metadata row for a table and optional user.
   * @param tableName the name of the table
   * @param userId the ID of the user (optional)
   * @returns true if the operation was successful
   */
  static async deleteSyncRow(tableName: TableName, userId?: string | null): Promise<boolean> {
    const id = generateMetadataId(tableName, userId ?? 'placeholder');
    await db.metadata.delete(id);
    return true;
  }
}
