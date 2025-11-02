import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/database/models/db";
import Grammar from "@/database/models/grammar";
import UserScore from "@/database/models/user-scores";
import UserItem from "@/database/models/user-items";
import AudioRecord from "@/database/models/audio-records";

export function useDataSync() {
  const { session } = useAuth();

  useEffect(() => {
    async function checkAndSyncData() {
      if (!session?.user?.user_metadata?.id) {
        console.error("No valid session or user ID found.");
        return;
      }
      db.userId = session.user.user_metadata.id;
      console.log("Set db.userId to", db.userId);

      try {
        await UserItem.syncUserItemsData();
        await Grammar.syncGrammarData();
        await UserScore.syncUserScoreData();
        await AudioRecord.syncAudioData();
      } catch (error) {
        console.error("Error syncing data:", error);
      }
    }

    checkAndSyncData();
  }, [session?.user?.user_metadata?.id]);
}
