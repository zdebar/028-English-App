import { db } from '@/database/models/db';
import Grammar from '@/database/models/grammar';
import UserScore from '@/database/models/user-scores';
import UserItem from '@/database/models/user-items';
import AudioRecord from '@/database/models/audio-records';
import { triggerUserItemsUpdatedEvent } from '@/database/database.utils';
import { infoHandler } from '@/features/logging/info-handler';

/**
 * Synchronizes user-related data with the local database.
 *
 * This function opens the database connection and performs synchronization
 * of user items, grammar data, user scores, and audio records.
 *
 * @param userId - The unique identifier of the user whose data should be synchronized.
 * @throws Error if any part of the synchronization process fails.
 */
export async function dataSync(userId: string): Promise<void> {
  // const grammarSyncCount = await Grammar.syncGrammarDataAll();
  // infoHandler(`Synchronized ${grammarSyncCount} Grammar records.`);

  // const userScoreSyncCount = await UserScore.syncUserScoreAll(userId);
  // infoHandler(`Synchronized ${userScoreSyncCount} UserScore records.`);

  // const userItemSyncCount = await UserItem.syncUserItemsAll(userId);
  // infoHandler(`Synchronized ${userItemSyncCount} UserItem records.`);

  // await AudioRecord.syncAudioData();
  triggerUserItemsUpdatedEvent(userId);
}
