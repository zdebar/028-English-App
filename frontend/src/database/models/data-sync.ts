import { db } from "@/database/models/db";
import Grammar from "@/database/models/grammar";
import UserScore from "@/database/models/user-scores";
import UserItem from "@/database/models/user-items";
import AudioRecord from "@/database/models/audio-records";
import { useUserStore } from "@/hooks/use-user";

export async function dataSync(userId: string): Promise<boolean> {
  const reloadUserScore = useUserStore.getState().reloadUserScore;

  try {
    await db.open();
    await UserItem.syncUserItemsData(userId);
    await Grammar.syncGrammarData();
    await UserScore.syncUserScoreData(userId);
    await reloadUserScore(userId);
    await AudioRecord.syncAudioData();
    return true;
  } catch (error) {
    console.error("Error during data synchronization:", error);
    return false;
  }
}
