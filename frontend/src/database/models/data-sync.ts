import config from '@/config/config';
import { triggerUserItemsUpdatedEvent } from '@/database/database.utils';
import AudioRecord from '@/database/models/audio-records';
import { db } from '@/database/models/db';
import Grammar from '@/database/models/grammar';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';

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

  await db.open();
  triggerUserItemsUpdatedEvent(userId);

  if (now - lastFullSync > config.sync.fullSyncInterval) {
    // Full synchronization
    await Grammar.syncGrammarAll();
    await UserScore.syncUserScoreAll(userId);
    await UserItem.syncUserItemsAll(userId);
    localStorage.setItem(FULL_SYNC_KEY, String(now));
  } else {
    // Incremental synchronization
    await UserScore.syncUserScoreSinceLastSync(userId);
    await UserItem.syncUserItemsSinceLastSync(userId);
    await Grammar.syncGrammarSinceLastSync();
  }

  await AudioRecord.syncAudioData();
  await AudioRecord.auditAudioData();
  triggerUserItemsUpdatedEvent(userId);
}

/**
 * Synchronizes user data when a component unmounts.
 *
 * @param userId - The unique identifier of the user whose data should be synchronized
 * @returns A promise that resolves when the synchronization is complete
 */
export async function dataSyncOnUnmount(userId: string): Promise<void> {
  await UserScore.syncUserScoreSinceLastSync(userId);
  await UserItem.syncUserItemsSinceLastSync(userId);
}
