import { db } from "@/database/models/db";
import Grammar from "@/database/models/grammar";
import UserScore from "@/database/models/user-scores";
import UserItem from "@/database/models/user-items";
import AudioRecord from "@/database/models/audio-records";
import { triggerUserItemsUpdatedEvent } from "@/utils/database.utils";
import type { UUID } from "crypto";

export async function dataSync(userId: UUID): Promise<boolean> {
  try {
    await db.open();
    await UserItem.syncUserItemsData(userId);
    await Grammar.syncGrammarData();
    await UserScore.syncUserScoreData(userId);
    await AudioRecord.syncAudioData();
    return true;
  } catch (error) {
    console.error("Error during data synchronization:", error);
    return false;
  } finally {
    triggerUserItemsUpdatedEvent(userId);
  }
}
