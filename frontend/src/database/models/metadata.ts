import config from '@/config/config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { TableName } from '@/types/table.types';
import { Entity } from 'dexie';
import { validateUserIdUsage } from '../utils/metadata.utils';

export default class Metadata extends Entity<AppDB> {
  table_name!: TableName;
  synced_at?: string;
  user_id?: string;

  /**
   * Reads the last successful sync timestamp for a table scope.
   *
   * @param tableName Table whose sync metadata should be read.
   * @param userId Required for user-specific tables and omitted for shared tables.
   * @returns Stored ISO timestamp, or the configured epoch start date when no metadata row exists.
   * @throws Error when userId usage does not match the table type.
   */
  static async getSyncedAt(tableName: TableName, userId?: string): Promise<string> {
    const isUserSpecific = validateUserIdUsage(tableName, userId);

    const metadata = await db.metadata.get([
      tableName,
      isUserSpecific ? userId! : config.database.nullReplacementUserId,
    ]);

    return metadata?.synced_at ?? config.database.epochStartDate;
  }

  /**
   * Stores the last successful sync timestamp for a table scope.
   *
   * @param tableName Table whose metadata row should be updated.
   * @param syncTime ISO timestamp to persist after a successful sync.
   * @param userId Required for user-specific tables and omitted for shared tables.
   * @throws Error when userId usage does not match the table type.
   */
  static async markAsSynced(
    tableName: TableName,
    syncTime: string,
    userId?: string,
  ): Promise<void> {
    const isUserSpecific = validateUserIdUsage(tableName, userId);
    await db.metadata.put({
      table_name: tableName,
      user_id: isUserSpecific ? userId! : config.database.nullReplacementUserId,
      synced_at: syncTime,
    });
  }

  /**
   * Deletes the sync metadata row for a table scope.
   *
   * @param tableName Table whose metadata row should be deleted.
   * @param userId Required for user-specific tables and omitted for shared tables.
   * @throws Error when userId usage does not match the table type.
   */
  static async deleteSyncRow(tableName: TableName, userId?: string): Promise<void> {
    const isUserSpecific = validateUserIdUsage(tableName, userId);
    await db.metadata.delete([
      tableName,
      isUserSpecific ? userId! : config.database.nullReplacementUserId,
    ]);
  }
}
