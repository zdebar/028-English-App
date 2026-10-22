import { supabaseInstance } from '@/config/supabase.config';
import { db } from '@/database/models/db';
import Metadata from '@/database/models/metadata';
import { getSyncTimestamps, splitDeleted } from '@/database/utils/sync-generic.utils';
import config from '@/config/config';
import { reportInfo } from '@/features/logging/monitoring-handler';
import { SupabaseError } from '@/types/error.types';
import { TableName } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';

type UserItemAPI = Omit<
  UserItemLocal,
  | 'is_vocabulary'
  | 'started_at'
  | 'deleted_at'
  | 'next_at_cz_to_en'
  | 'mastered_at_cz_to_en'
  | 'next_at_en_to_cz'
  | 'mastered_at_en_to_cz'
  | 'is_cz_to_en_enabled'
  | 'is_en_to_cz_enabled'
> & {
  is_vocabulary: boolean;
  started_at: string | null;
  deleted_at: string | null;
  next_at_cz_to_en: string | null;
  mastered_at_cz_to_en: string | null;
  next_at_en_to_cz: string | null;
  mastered_at_en_to_cz: string | null;
  is_cz_to_en_enabled: boolean;
  is_en_to_cz_enabled: boolean;
};

type UserItemExport = Pick<
  UserItemAPI,
  | 'user_id'
  | 'item_id'
  | 'progress_cz_to_en'
  | 'started_at'
  | 'updated_at'
  | 'next_at_cz_to_en'
  | 'mastered_at_cz_to_en'
  | 'progress_en_to_cz'
  | 'next_at_en_to_cz'
  | 'mastered_at_en_to_cz'
>;

const NULL_DATE = config.database.nullReplacementDate;

/** Pushes local changes, merges the remote response, and saves its sync cursor. */
export async function syncUserItemsFromRemote(
  userId: string,
  doFullSync: boolean,
): Promise<number> {
  const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
    doFullSync,
    TableName.UserItems,
    userId,
  );
  const localSnapshot = await getUserItems(userId);
  const localItems = localSnapshot
    .filter((item) => isWithinSyncWindow(item, lastSyncedAt, newSyncedAt))
    .map(convertLocalToExport);
  reportInfo(`Completed ${localItems.length} UserItems push to remote`);

  const updatedItems = await syncWithRemote(userId, localItems, lastSyncedAt, newSyncedAt);
  const { toUpsert, toDelete } = splitDeleted(updatedItems);
  let preservedConcurrentChanges = false;

  await db.transaction('rw', db.user_items, db.metadata, async () => {
    const currentItems = await getUserItems(userId);
    const snapshotByKey = new Map(localSnapshot.map((item) => [getUserItemKey(item), item]));
    const concurrentKeys = new Set(
      currentItems
        .filter((item) => hasChangedSinceSnapshot(item, snapshotByKey))
        .map(getUserItemKey),
    );
    preservedConcurrentChanges = concurrentKeys.size > 0;

    if (doFullSync) {
      const keysToDelete = currentItems
        .filter((item) => !concurrentKeys.has(getUserItemKey(item)))
        .map((item) => [item.user_id, item.item_id] as [string, number]);
      if (keysToDelete.length > 0) await db.user_items.bulkDelete(keysToDelete);
    } else if (toDelete.length > 0) {
      const keysToDelete = toDelete
        .filter((item) => !concurrentKeys.has(getUserItemKey(item)))
        .map((item) => [item.user_id, item.item_id] as [string, number]);
      if (keysToDelete.length > 0) await db.user_items.bulkDelete(keysToDelete);
    }

    const rowsToUpsert = toUpsert.filter((item) => !concurrentKeys.has(getUserItemKey(item)));
    if (rowsToUpsert.length > 0) await db.user_items.bulkPut(rowsToUpsert);
    if (!preservedConcurrentChanges) {
      await Metadata.markAsSynced(TableName.UserItems, newSyncedAt, userId);
    }
  });

  if (preservedConcurrentChanges) {
    reportInfo('Preserved local UserItems changes made during synchronization.');
  }
  return updatedItems.length;
}

async function getUserItems(userId: string): Promise<UserItemLocal[]> {
  return db.user_items.where('user_id').equals(userId).toArray();
}

async function syncWithRemote(
  userId: string,
  items: UserItemExport[],
  lastSyncedAt: string,
  newSyncedAt: string,
): Promise<UserItemLocal[]> {
  const { data, error } = await supabaseInstance.rpc('upsert_fetch_user_items', {
    p_user_id: userId,
    p_last_synced_at: lastSyncedAt,
    p_sync_until: newSyncedAt,
    p_user_items: items,
  });

  if (error) {
    throw new SupabaseError('Error fetching user_items with Supabase.', error, {
      itemCount: items.length,
      lastSyncedAt,
      newSyncedAt,
    });
  }
  if (!data?.length) return [];
  return (data as UserItemAPI[]).map(convertAPIToLocal);
}

function convertLocalToExport(localItem: UserItemLocal): UserItemExport {
  return {
    user_id: localItem.user_id,
    item_id: localItem.item_id,
    progress_cz_to_en: localItem.progress_cz_to_en,
    updated_at: localItem.updated_at,
    started_at: toRemoteDate(localItem.started_at),
    next_at_cz_to_en: toRemoteDate(localItem.next_at_cz_to_en),
    mastered_at_cz_to_en: toRemoteDate(localItem.mastered_at_cz_to_en),
    progress_en_to_cz: localItem.progress_en_to_cz,
    next_at_en_to_cz: toRemoteDate(localItem.next_at_en_to_cz),
    mastered_at_en_to_cz: toRemoteDate(localItem.mastered_at_en_to_cz),
  };
}

function convertAPIToLocal(apiItem: UserItemAPI): UserItemLocal {
  return {
    ...apiItem,
    is_vocabulary: apiItem.is_vocabulary ? 1 : 0,
    started_at: replaceNullDate(apiItem.started_at),
    next_at_cz_to_en: replaceNullDate(apiItem.next_at_cz_to_en),
    mastered_at_cz_to_en: replaceNullDate(apiItem.mastered_at_cz_to_en),
    next_at_en_to_cz: replaceNullDate(apiItem.next_at_en_to_cz),
    mastered_at_en_to_cz: replaceNullDate(apiItem.mastered_at_en_to_cz),
    progress_en_to_cz: apiItem.progress_en_to_cz ?? 0,
    is_cz_to_en_enabled: apiItem.is_cz_to_en_enabled ?? true,
    is_en_to_cz_enabled: apiItem.is_en_to_cz_enabled ?? true,
    deleted_at: replaceNullDate(apiItem.deleted_at),
  };
}

function isWithinSyncWindow(
  item: Pick<UserItemLocal, 'updated_at'>,
  lastSyncedAt: string,
  newSyncedAt: string,
): boolean {
  return item.updated_at > lastSyncedAt && item.updated_at <= newSyncedAt;
}

function hasChangedSinceSnapshot(
  item: UserItemLocal,
  snapshotByKey: ReadonlyMap<string, UserItemLocal>,
): boolean {
  const snapshot = snapshotByKey.get(getUserItemKey(item));
  return snapshot?.updated_at !== item.updated_at;
}

function getUserItemKey(item: Pick<UserItemLocal, 'user_id' | 'item_id'>): string {
  return `${item.user_id}:${item.item_id}`;
}

function toRemoteDate(value: string): string | null {
  return value === NULL_DATE ? null : value;
}

function replaceNullDate(value: string | null): string {
  return value ?? NULL_DATE;
}
