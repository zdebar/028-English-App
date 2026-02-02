import { db } from '@/database/models/db';
import Grammar from '@/database/models/grammar';
import UserScore from '@/database/models/user-scores';
import UserItem from '@/database/models/user-items';
import AudioRecord from '@/database/models/audio-records';
import { triggerUserItemsUpdatedEvent } from '@/database/database.utils';

/**
 * Synchronizes user-related data with the local database.
 *
 * This function opens the database connection and performs parallel synchronization
 * of user items, grammar data, user scores, and audio records. It returns a boolean
 * indicating the success or failure of the synchronization process. Regardless of the
 * outcome, it triggers an event to notify that user items have been updated.
 *
 * @param userId - The unique identifier of the user whose data should be synchronized.
 * @returns A promise that resolves to `true` if synchronization succeeds, or `false` if an error occurs.
 */
export async function dataSync(userId: string): Promise<boolean> {
  try {
    await db.open();
    await Promise.all([
      UserItem.syncUserItemsData(userId),
      Grammar.syncGrammarData(),
      UserScore.syncUserScoreData(userId),
      AudioRecord.syncAudioData(),
    ]);
    return true;
  } catch (error) {
    console.error('Error during data synchronization:', error);
    return false;
  } finally {
    triggerUserItemsUpdatedEvent(userId);
  }
}
