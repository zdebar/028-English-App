import config from '@/config/config';
import { triggerUserItemsUpdatedEvent } from '@/database/utils/database.utils';
import AudioRecord from '@/database/models/audio-records';
import { initDbMappings } from '@/database/models/db-init';
import Grammar from '@/database/models/grammar';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { restoreUnsavedFromLocalStorage } from '@/database/utils/database.utils';
import { getFullSyncTime, setFullSyncTime } from '@/database/utils/sync-time.utils';
import { logRejectedResults } from '@/features/logging/logging.utils';
import Lessons from '@/database/models/lessons';

/**
 * Synchronizes data for a specific user with the database.
 *
 * @param userId - The unique identifier of the user to synchronize data for
 * @returns A promise that resolves when the data synchronization is complete
 */
export async function dataSync(userId: string): Promise<void> {
  const now = Date.now();
  const lastFullSync = getFullSyncTime(userId);

  await initDbMappings();
  await restoreUnsavedFromLocalStorage(userId);

  // Step 1: Determine if a full sync is needed
  const doFullSync = now - lastFullSync > config.sync.fullSyncInterval;

  // Step 2: Perform shared stores data synchronization (grammar and audio metadata)
  const sharedPromises = doFullSync
    ? [
        Grammar.syncFromRemote(true),
        Lessons.syncFromRemote(true),
        AudioRecord.syncFromRemote(config.audio.archives),
      ]
    : [
        Grammar.syncFromRemote(false),
        Lessons.syncFromRemote(false),
        AudioRecord.syncFromRemote(config.audio.archives),
      ];

  void Promise.allSettled(sharedPromises).then((results) => {
    logRejectedResults(results, 'Data synchronization error:');
  });

  // Step 3: Perform user stores data synchronization (user_scores and user_items)
  const userPromises = doFullSync
    ? [UserScore.syncFromRemote(userId, true), UserItem.syncUserItemsAll(userId)]
    : [UserScore.syncFromRemote(userId, false), UserItem.syncUserItemsSinceLastSync(userId)];

  const userResults = await Promise.allSettled(userPromises);
  const isError = logRejectedResults(userResults, 'Data synchronization error:');
  triggerUserItemsUpdatedEvent(userId);

  if (isError) throw new Error('Data synchronization error');
  if (doFullSync) {
    setFullSyncTime(userId, now);
  }
}

/**
 * Synchronizes user data when a component unmounts.
 *
 * @param userId - The unique identifier of the user whose data should be synchronized
 * @returns A promise that resolves when the synchronization is complete
 */
export async function dataSyncOnUnmount(userId: string): Promise<void> {
  if (!userId) return;

  const results = await Promise.allSettled([
    UserScore.syncFromRemote(userId, false),
    UserItem.syncUserItemsSinceLastSync(userId),
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
  const toUpsert: T[] = [];
  const toDelete: T[] = [];
  items.forEach((item) => {
    if (item.deleted_at === null) {
      toUpsert.push(item);
    } else {
      toDelete.push(item);
    }
  });
  return { toUpsert, toDelete };
}
