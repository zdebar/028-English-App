import { db } from "@/database/models/db";
import Grammar from "@/database/models/grammar";
import UserScore from "@/database/models/user-scores";
import UserItem from "@/database/models/user-items";
import AudioRecord from "@/database/models/audio-records";
import { useUserStore } from "@/hooks/use-user";

export async function dataSync(): Promise<void> {
  const reloadUserScore = useUserStore.getState().reloadUserScore;

  try {
    await db.open();
    await UserItem.syncUserItemsData();
    await Grammar.syncGrammarData();
    await UserScore.syncUserScoreData();
    await AudioRecord.syncAudioData();
    await reloadUserScore();
  } catch (error) {
    console.error("Error syncing data:", error);
  }
}
