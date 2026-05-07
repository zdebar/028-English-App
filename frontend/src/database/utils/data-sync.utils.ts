import config from '@/config/config';
import AudioRecord from '@/database/models/audio-records';
import { initDbMappings } from '@/database/models/db-init';
import UserItem from '@/database/models/user-items';
import UserScoreType from '@/database/models/user-scores';
import { restoreUnsavedFromLocalStorage } from '@/database/utils/database.utils';
import { getFullSyncTime, setFullSyncTime } from '@/database/utils/sync-time.utils';
import { logRejectedResults } from '@/features/logging/logging.utils';
import Lessons from '@/database/models/lessons';
import Levels from '@/database/models/levels';
import { db } from '../models/db';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import Metadata from '../models/metadata';
import { infoHandler } from '@/features/logging/info-handler';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { supabaseInstance } from '@/config/supabase.config';
import { triggerDailyCountUpdatedEvent, triggerLevelsUpdatedEvent } from '@/utils/dashboard.utils';
import Blocks from '../models/blocks';
import Grammar from '@/database/models/grammar';

/**
 * Synchronizes data for a specific user with the database.
 *
 * @param userId - The unique identifier of the user to synchronize data for
 * @returns A promise that resolves when the data synchronization is complete
 */
export async function dataSync(userId: string, fullSync: boolean = false): Promise<void> {
  assertNonEmptyString(userId, 'userId');

  await initDbMappings();
  await restoreUnsavedFromLocalStorage(userId);

  // Step 1: Determine if a full sync is needed
  const now = Date.now();
  let doFullSync = fullSync;
  if (!fullSync) {
    const lastFullSync = getFullSyncTime(userId);
    doFullSync = now - lastFullSync > config.sync.fullSyncInterval;
  }

  // Step 2: Perform shared stores data synchronization (grammar and audio metadata)
  const allPromises = doFullSync
    ? [
        Grammar.syncFromRemote(true),
        Levels.syncFromRemote(true),
        Lessons.syncFromRemote(true),
        Blocks.syncFromRemote(true),
        UserScoreType.syncFromRemote(userId, true),
        UserItem.syncFromRemote(userId, true),
      ]
    : [
        Grammar.syncFromRemote(false),
        Levels.syncFromRemote(false),
        Lessons.syncFromRemote(false),
        Blocks.syncFromRemote(false),
        UserScoreType.syncFromRemote(userId, false),
        UserItem.syncFromRemote(userId, false),
      ];

  const userResults = await Promise.allSettled(allPromises);
  const isError = logRejectedResults(userResults, 'Data synchronization error:');

  triggerDailyCountUpdatedEvent(userId);
  triggerLevelsUpdatedEvent(userId);
  if (isError) throw new Error('Data synchronization error');
  if (doFullSync) {
    setFullSyncTime(userId, now);
  }
}

/**
 * Synchronizes data for a specific user with the database.
 *
 * @param userId - The unique identifier of the user to synchronize data for
 * @param downloadAll - Whether to download all audio files (for PWA) or only selected ones (for web app)
 * @returns A promise that resolves when the data synchronization is complete
 */
export async function audioSync(userId: string, downloadAll: boolean = false): Promise<void> {
  assertNonEmptyString(userId, 'userId');

  const supportsMatchMedia =
    typeof globalThis !== 'undefined' && typeof globalThis.matchMedia === 'function';
  const isDisplayStandalone =
    supportsMatchMedia && globalThis.matchMedia('(display-mode: standalone)').matches;
  const isStandalone =
    downloadAll || isDisplayStandalone || (globalThis.navigator as any).standalone === true;

  if (isStandalone) {
    // PWA or downloadAll: download all audio files
    await AudioRecord.syncFromRemote(config.audio.allArchives);
  } else {
    // Web app: download only selected audio files
    await AudioRecord.syncFromRemote(config.audio.initialArchive);
  }
}

/**
 * Synchronizes user data when a component unmounts.
 *
 * @param userId - The unique identifier of the user whose data should be synchronized
 * @returns A promise that resolves when the synchronization is complete
 */
export async function dataSyncOnUnmount(userId: string): Promise<void> {
  assertNonEmptyString(userId, 'userId');

  const { data: sessionData } = await supabaseInstance.auth.getSession();
  if (!sessionData.session) {
    return;
  }

  const results = await Promise.allSettled([
    UserScoreType.syncFromRemote(userId, false),
    UserItem.syncFromRemote(userId, false),
  ]);

  logRejectedResults(results, 'Unmount synchronization failed');
}

/**
 * Splits items into upsert and delete arrays based on deleted_at property.
 * @param items - Array of items with deleted_at property
 * @returns { toUpsert: T[], toDelete: T[] } Object containing arrays of items to upsert and delete
 */
export function splitDeleted<T extends { deleted_at: string | null }>(
  items: T[],
): { toUpsert: T[]; toDelete: T[] } {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array.');
  }
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
 * Generic function to sync any table from a remote source.
 * @param dbTable - Dexie table instance. Requires casting to Dexie.Table<TableType, number> see example.
 * @param tableName - Table name for metadata
 * @param fetchRemoteFn - Function to fetch remote data, must return array of entities
 * @param doFullSync - Whether to perform a full sync
 *
 * @example
 * await syncFromRemoteGeneric(db.levels as Dexie.Table<LevelLocal, number>, TableName.Levels, Levels.fetchFromRemote, false);
 */
export async function syncFromRemoteGeneric<T extends { deleted_at: string | null; id: number }>(
  dbTable: Dexie.Table<T, number>,
  tableName: TableName,
  fetchRemoteFn: (lastSyncedAt: string) => Promise<T[]>,
  doFullSync: boolean = false,
): Promise<void> {
  if (!dbTable) throw new Error('dbTable is required.');
  if (typeof fetchRemoteFn !== 'function') throw new Error('fetchRemoteFn must be a function.');

  // Step 1: Determine last synced timestamp and new sync timestamp
  const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(doFullSync, tableName);

  // Step 2: Fetch remote data
  const remoteItems = await fetchRemoteFn(lastSyncedAt);

  // Step 3: Split remote items into upsert and delete lists
  const { toUpsert, toDelete } = splitDeleted(remoteItems);

  // Step 4: Sync with local database in a transaction
  await db.transaction('rw', dbTable, db.metadata, async () => {
    if (doFullSync) {
      await dbTable.clear();
    } else if (toDelete.length > 0) {
      await dbTable.bulkDelete(toDelete.map((item: any) => item.id));
    }
    if (toUpsert.length > 0) {
      await dbTable.bulkPut(toUpsert);
    }
    await Metadata.markAsSynced(tableName, newSyncedAt);
  });

  infoHandler(`Completed ${remoteItems.length} ${tableName} pull from remote.`);
}

/**
 * Returns the last synced timestamp and the new sync timestamp for a user.
 * @param doFullSync - Whether to perform a full sync.
 * @param tableName - The name of the table.
 * @param userId - The user ID.
 */
export async function getSyncTimestamps(
  doFullSync: boolean,
  tableName: TableName,
  userId?: string,
): Promise<{ lastSyncedAt: string; newSyncedAt: string }> {
  if (!doFullSync && userId != null) {
    assertNonEmptyString(userId, 'userId');
  }
  const lastSyncedAt = doFullSync
    ? config.database.epochStartDate
    : await Metadata.getSyncedAt(tableName, userId);
  const newSyncedAt = new Date().toISOString();
  return { lastSyncedAt, newSyncedAt };
}
