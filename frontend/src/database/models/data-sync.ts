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
import { getFullSyncTime, setFullSyncTime, setPartialSyncTime } from '@/database/sync-time.utils';

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
