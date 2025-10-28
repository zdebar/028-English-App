import { useEffect } from "react";
import { setupIndexedDB } from "../utils/indexedDB.utils";
import { checkAndSync, checkAndSyncAudio } from "../utils/sync.utils";

export function useDataSync() {
  useEffect(() => {
    async function checkAndSyncData() {
      const dbName = "AppDatabase";
      const dbVersion = 1;

      const request = setupIndexedDB(dbName, dbVersion);

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
