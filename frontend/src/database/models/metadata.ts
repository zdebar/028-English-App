import config from '@/config/config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { TableName } from '@/types/table.types';
import { Entity } from 'dexie';

/**
 * Local sync metadata model for tracking per-table synchronization windows.
 *
 * Public API:
 * - `getSyncedAt` reads a table scope timestamp with an epoch fallback.
 * - `markAsSynced` stores the timestamp after a successful sync.
 * - `deleteSyncRow` clears a table scope marker.
 *
 * User-specific tables require a user id; shared lookup tables must omit it.
 */
export default class SyncMetadata extends Entity<AppDB> {
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
    const metadata = await db.metadata.get(getSyncMetadataKey(tableName, userId));

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
    const [metadataTableName, metadataUserId] = getSyncMetadataKey(tableName, userId);
    await db.metadata.put({
      table_name: metadataTableName,
      user_id: metadataUserId,
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
    await db.metadata.delete(getSyncMetadataKey(tableName, userId));
  }
}

function getSyncMetadataKey(tableName: TableName, userId?: string): [TableName, string] {
  const isUserSpecific = isUserSpecificTable(tableName);
  if (isUserSpecific && !userId) {
    throw new Error(`userId is required for user-specific table: ${tableName}.`);
  }
  if (!isUserSpecific && userId) {
    throw new Error(`userId must not be provided for shared table: ${tableName}.`);
  }
  const metadataUserId = isUserSpecific && userId
    ? userId
    : config.database.nullReplacementUserId;
  return [tableName, metadataUserId];
}

function isUserSpecificTable(tableName: TableName): boolean {
  return tableName === TableName.UserItems || tableName === TableName.UserLessons;
}
