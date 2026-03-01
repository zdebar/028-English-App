import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
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
} from '@/database/sync-time.utils';
import { TEXTS } from '@/locales/cs';

async function hasActiveSessionForUser(userId: string): Promise<boolean> {
  const { data, error } = await supabaseInstance.auth.getSession();
  if (error) return false;
  return data.session?.user?.id === userId;
}

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

  const doFullSync = now - lastFullSync > config.sync.fullSyncInterval;

  let userPromises: Promise<any>[];
  let otherPromises: Promise<any>[];

  if (doFullSync) {
    userPromises = [UserScore.syncUserScoreAll(userId), UserItem.syncUserItemsAll(userId)];
    otherPromises = [Grammar.syncGrammarAll(), AudioRecord.syncAudioData(config.audio.archives)];
  } else {
    userPromises = [
      UserScore.syncUserScoreSinceLastSync(userId),
      UserItem.syncUserItemsSinceLastSync(userId),
    ];
    otherPromises = [
      Grammar.syncGrammarSinceLastSync(),
      AudioRecord.syncAudioData(config.audio.archives),
    ];
  }

  Promise.allSettled(otherPromises).then((results) => {
    results.forEach((r) => {
      if (r.status === 'rejected') {
        errorHandler('Data synchronization error:', r.reason);
      }
    });
  });

  const userResults = await Promise.allSettled(userPromises);
  let firstError: any = null;
  userResults.forEach((r) => {
    if (r.status === 'rejected') {
      errorHandler('Data synchronization error:', r.reason);
      if (!firstError) firstError = r.reason;
    }
  });
  if (firstError) throw firstError;

  triggerUserItemsUpdatedEvent(userId);

  if (doFullSync) {
    setFullSyncTime(userId, now);
  }
  setPartialSyncTime(userId, now);
}

/**
 * Synchronizes user data when a component unmounts.
 *
 * @param userId - The unique identifier of the user whose data should be synchronized
 * @returns A promise that resolves when the synchronization is complete
 */
export async function dataSyncOnUnmount(userId: string): Promise<void> {
  const canSync = await hasActiveSessionForUser(userId);
  if (!canSync) return;

  await initDbMappings();

  const results = await Promise.allSettled([
    UserScore.syncUserScoreSinceLastSync(userId),
    UserItem.syncUserItemsSinceLastSync(userId),
  ]);

  results.forEach((result) => {
    if (result.status === 'rejected') {
      errorHandler('Unmount synchronization failed', result.reason);
    }
  });
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
  let isDisposed = false;
  let inFlightSync: Promise<void> | null = null;

  const runSync = async () => {
    if (inFlightSync) {
      await inFlightSync;
      return;
    }

    inFlightSync = (async () => {
      setLoading(true);
      try {
        if (userId) {
          await dataSync(userId);
          void AudioRecord.removeOrphaned();
        }
        showToast(TEXTS.syncSuccessToast, 'success');
      } catch (error) {
        showToast(TEXTS.syncErrorToast, 'error');
        errorHandler('Data synchronization failed', error);
      } finally {
        if (!isDisposed) {
          setLoading(false);
        }
      }
    })();

    try {
      await inFlightSync;
    } finally {
      inFlightSync = null;
    }
  };

  const checkAndSync = () => {
    const now = Date.now();
    const lastSyncTimestamp = getPartialSyncTime(userId);

    if (now - lastSyncTimestamp > config.sync.periodicSyncInterval) {
      void runSync();
      setPartialSyncTime(userId, now);
    }
  };

  void runSync();
  intervalId = setInterval(checkAndSync, config.sync.periodicSyncInterval);

  return () => {
    isDisposed = true;
    clearInterval(intervalId);
    if (userId) {
      void dataSyncOnUnmount(userId).catch((error) => {
        errorHandler('Unmount synchronization failed', error);
      });
    }
  };
}
