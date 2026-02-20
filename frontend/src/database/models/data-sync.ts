import config from '@/config/config';
import { triggerUserItemsUpdatedEvent } from '@/database/database.utils';
import AudioRecord from '@/database/models/audio-records';
import { initDbMappings } from '@/database/models/db-init';
import Grammar from '@/database/models/grammar';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { errorHandler } from '@/features/logging/error-handler';
import { restoreUnsavedFromLocalStorage } from '@/database/database.utils';
import {
  getFullSyncTime,
  getPartialSyncTime,
  setFullSyncTime,
  setPartialSyncTime,
} from '@/components/utils/sync-time';
import { TEXTS } from '@/locales/cs';

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
  triggerUserItemsUpdatedEvent(userId);

  let syncPromises: Promise<any>[];
  const doFullSync = now - lastFullSync > config.sync.fullSyncInterval;

  if (doFullSync) {
    // Full synchronization
    syncPromises = [
      Grammar.syncGrammarAll(),
      UserScore.syncUserScoreAll(userId),
      UserItem.syncUserItemsAll(userId),
      AudioRecord.syncAudioData(config.audio.startArchives),
    ];
  } else {
    // Incremental synchronization
    syncPromises = [
      UserScore.syncUserScoreSinceLastSync(userId),
      UserItem.syncUserItemsSinceLastSync(userId),
      Grammar.syncGrammarSinceLastSync(),
      AudioRecord.syncAudioData(config.audio.startArchives),
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

  if (doFullSync) {
    setFullSyncTime(userId, now);
  }
  setPartialSyncTime(userId, now);

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

/**
 * Starts a periodic synchronization process for user data and audio records.
 *
 * Performs an initial sync immediately, then checks daily if sync is needed based on
 * the last sync date stored in localStorage. Additionally, syncs audio data and removes
 * orphaned audio files.
 *
 * @param userId - The ID of the user whose data should be synchronized
 * @param setLoading - Callback function to update the loading state during synchronization
 * @param showToast - Callback function to display toast notifications with success or error messages
 *
 * @returns A cleanup function that stops the periodic sync interval and performs final
 *          synchronization on component unmount
 */
export function startPeriodicSync(
  userId: string,
  setLoading: (loading: boolean) => void,
  showToast: (message: string, type: 'success' | 'error') => void,
): () => void {
  let intervalId: NodeJS.Timeout;

  const syncData = async () => {
    setLoading(true);
    try {
      if (userId) {
        await dataSync(userId);
      }
      showToast(TEXTS.syncSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.syncErrorToast, 'error');
      errorHandler('Data synchronization failed', error);
    } finally {
      setLoading(false);
    }
    try {
      await AudioRecord.syncAudioData(config.audio.startArchives);
      await AudioRecord.removeOrphaned();
    } catch (error) {
      errorHandler('Remaining audio data synchronization failed', error);
    }
  };

  const checkAndSync = () => {
    const now = Date.now();
    const lastSyncTimestamp = getPartialSyncTime(userId);

    if (now - lastSyncTimestamp > config.sync.periodicSyncInterval) {
      syncData();
      localStorage.setItem('lastSyncTimestamp', String(now));
    }
  };

  checkAndSync();
  intervalId = setInterval(checkAndSync, config.sync.periodicSyncInterval);

  syncData();

  return () => {
    clearInterval(intervalId);
    if (userId) {
      dataSyncOnUnmount(userId);
    }
  };
}
