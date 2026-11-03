import config from '@/config/config';
import SyncMetadata from '@/database/models/metadata';
import type { TableName } from '@/types/table.types';

/**
 * Splits sync rows by deletion state.
 *
 * @param items Rows with a deleted_at marker.
 * @returns Rows with null or the configured null replacement date in toUpsert; all other rows in toDelete.
 */
export function splitDeleted<T extends { deleted_at: string | null }>(
  items: T[],
): { toUpsert: T[]; toDelete: T[] } {
  const toUpsert: T[] = [];
  const toDelete: T[] = [];
  items.forEach((item) => {
    if (item.deleted_at === null || item.deleted_at === config.database.nullReplacementDate) {
      toUpsert.push(item);
    } else {
      toDelete.push(item);
    }
  });
  return { toUpsert, toDelete };
}

/**
 * Resolves the stored sync checkpoint and a new timestamp for the current sync.
 *
 * @param tableName Table whose sync metadata should be read.
 * @param userId Required for user-specific tables and omitted for shared tables.
 * @returns The lower bound for remote changes and the new sync timestamp to persist after success.
 * @throws Error from metadata validation when userId usage does not match the table type.
 */
export async function getSyncTimestamps(
  tableName: TableName,
  userId?: string,
): Promise<{ lastSyncedAt: string; newSyncedAt: string }> {
  const lastSyncedAt = await SyncMetadata.getSyncedAt(tableName, userId);
  const newSyncedAt = new Date().toISOString();
  return { lastSyncedAt, newSyncedAt };
}
