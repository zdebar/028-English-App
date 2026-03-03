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
    ? [Grammar.syncGrammarAll(), AudioRecord.syncAudioData(config.audio.archives)]
    : [Grammar.syncGrammarSinceLastSync(), AudioRecord.syncAudioData(config.audio.archives)];

  void Promise.allSettled(sharedPromises).then((results) => {
    logRejectedResults(results, 'Data synchronization error:');
  });

  // Step 2: Perform user stores data synchronization (user_scores and user_items)
  const userPromises = doFullSync
    ? [UserScore.syncUserScoreAll(userId), UserItem.syncUserItemsAll(userId)]
    : [UserScore.syncUserScoreSinceLastSync(userId), UserItem.syncUserItemsSinceLastSync(userId)];

  const userResults = await Promise.allSettled(userPromises);
  const isError = logRejectedResults(userResults, 'Data synchronization error:');
  if (isError) throw new Error('Data synchronization error');

  // Step 3: Trigger user items updated event and update sync times
  triggerUserItemsUpdatedEvent(userId);
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
    UserScore.syncUserScoreSinceLastSync(userId),
    UserItem.syncUserItemsSinceLastSync(userId),
  ]);

  logRejectedResults(results, 'Unmount synchronization failed');
}
