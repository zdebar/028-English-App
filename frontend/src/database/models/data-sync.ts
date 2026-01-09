import { db } from '@/database/models/db';
import Grammar from '@/database/models/grammar';
import UserScore from '@/database/models/user-scores';
import UserItem from '@/database/models/user-items';
import AudioRecord from '@/database/models/audio-records';
import { triggerUserItemsUpdatedEvent } from '@/database/database.utils';

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
