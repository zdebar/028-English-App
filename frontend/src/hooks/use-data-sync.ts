import { useEffect } from "react";
import { checkAndSync, checkAndSyncAudio } from "@/utils/sync.utils";
import AppDB from "@/database/AppDB";

export function useDataSync() {
  useEffect(() => {
    async function checkAndSyncData() {
      /** Check data */

      request.onsuccess = async () => {
        const db = request.result;
        const bucketName = "anon-data";

        // Sync Grammar Store
        await checkAndSync(
          db,
          "grammar",
          bucketName,
          "/grammar.json",
          "/grammar-metadata.json"
        );

        // Sync User Items Store
        await checkAndSync(
          db,
          "user-items",
          bucketName,
          "/user-items.json",
          "/user-items-metadata.json"
        );

        // Sync Audio Store
        await checkAndSyncAudio(
          db,
          "audio",
          bucketName,
          "/audio.zip",
          "/audio-metadata.json"
        );
      };

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
      };
    }

    checkAndSyncData();
  }, []);
}
