import { db } from "@/database/models/db";
import Grammar from "@/database/models/grammar";
import UserScore from "@/database/models/user-scores";
import UserItem from "@/database/models/user-items";
import AudioRecord from "@/database/models/audio-records";

export async function dataSync(userId: string): Promise<void> {
  if (!userId) {
    console.warn("No valid user ID found. Skipping data sync.");
    return;
  }

  db.userId = userId;

  try {
    await db.open();
    await UserItem.syncUserItemsData();
    await Grammar.syncGrammarData();
    await UserScore.syncUserScoreData();
    await AudioRecord.syncAudioData();
  } catch (error) {
    console.error("Error syncing data:", error);
  }
}
