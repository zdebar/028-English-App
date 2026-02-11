import config from '@/config/config';
import { triggerUserItemsUpdatedEvent } from '@/database/database.utils';
import AudioRecord from '@/database/models/audio-records';
import { initDbMappings } from '@/database/models/db-init';
import Grammar from '@/database/models/grammar';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { errorHandler } from '@/features/logging/error-handler';

const FULL_SYNC_KEY = 'lastFullSyncAt';

/**
 * Synchronizes data for a specific user with the database.
 *
 * @param userId - The unique identifier of the user to synchronize data for
 * @returns A promise that resolves when the data synchronization is complete
 */
export async function dataSync(userId: string): Promise<void> {
  const now = Date.now();
  const lastFullSync = Number(localStorage.getItem(FULL_SYNC_KEY) || 0);

  await initDbMappings();
  triggerUserItemsUpdatedEvent(userId);

  let syncPromises: Promise<any>[];
  const doFullSync = now - lastFullSync > config.sync.fullSyncInterval;

  if (doFullSync) {
    // Full synchronization
    syncPromises = [
      Grammar.syncGrammarAll(),
      UserScore.syncUserScoreAll(userId),
      UserItem.syncUserItemsAll(userId),
      AudioRecord.syncAudioData(),
    ];
  } else {
    // Incremental synchronization
    syncPromises = [
      UserScore.syncUserScoreSinceLastSync(userId),
      UserItem.syncUserItemsSinceLastSync(userId),
      Grammar.syncGrammarSinceLastSync(),
      AudioRecord.syncAudioData(),
    ];
  }

  const results = await Promise.allSettled(syncPromises);
  let firstError: any = null;
  results.forEach((r) => {
    if (r.status === 'rejected') {
      errorHandler('Data synchronization error:', r.reason);
      if (!firstError) firstError = r.reason;
    }
  });
  if (firstError) throw firstError;

  await AudioRecord.removeOrphaned();
  if (doFullSync) {
    localStorage.setItem(FULL_SYNC_KEY, String(now));
  }

  triggerUserItemsUpdatedEvent(userId);
}

/**
 * Synchronizes user data when a component unmounts.
 *
 * @param userId - The unique identifier of the user whose data should be synchronized
 * @returns A promise that resolves when the synchronization is complete
 */
export async function dataSyncOnUnmount(userId: string): Promise<void> {
  await initDbMappings();
  await UserScore.syncUserScoreSinceLastSync(userId);
  await UserItem.syncUserItemsSinceLastSync(userId);
}
