import config from '@/config/config';
import Metadata from '@/database/models/metadata';
import type { TableName } from '@/types/table.types';

/**
 * Splits items into upsert and delete arrays based on deleted_at property.
 */
export function splitDeleted<T extends { deleted_at: string | null }>(
  items: T[],
): { toUpsert: T[]; toDelete: T[] } {
  const toUpsert: T[] = [];
  const toDelete: T[] = [];
  items.forEach((item) => {
    if (item.deleted_at == null || item.deleted_at === config.database.nullReplacementDate) {
      toUpsert.push(item);
    } else {
      toDelete.push(item);
    }
  });
  return { toUpsert, toDelete };
}

/**
 * Returns the last synced timestamp and the new sync timestamp for a user.
 */
export async function getSyncTimestamps(
  doFullSync: boolean,
  tableName: TableName,
  userId?: string,
): Promise<{ lastSyncedAt: string; newSyncedAt: string }> {
  const lastSyncedAt = doFullSync
    ? config.database.epochStartDate
    : await Metadata.getSyncedAt(tableName, userId);
  const newSyncedAt = new Date().toISOString();
  return { lastSyncedAt, newSyncedAt };
}
