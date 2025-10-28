import { useEffect } from "react";
import { supabase } from "../utils/supabase.utils";
import type {
  Metadata,
  AudioRecord,
  Grammar,
  UserItem,
} from "../types/data.types";
import JSZip from "jszip";

interface MetadataFileConfig<T> {
  bucketName: string;
  dataFile: string;
  metadataFile: string;
  convertHandler: (data: Blob) => Promise<T>;
}

export function useDatabaseSync() {
  useEffect(() => {
    async function checkAndSyncDatabase() {
      const dbName = "AppDatabase";
      const dbVersion = 1;

      // Open IndexedDB
      const request = indexedDB.open(dbName, dbVersion);

      request.onupgradeneeded = () => {
        const db = request.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains("user-items")) {
          db.createObjectStore("user-items", { keyPath: ["id", "user_id"] });
        }
        if (!db.objectStoreNames.contains("grammar")) {
          db.createObjectStore("grammar", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("user-daily-score")) {
          db.createObjectStore("user-daily-score", {
            keyPath: ["user_id", "date"],
          });
        }
        if (!db.objectStoreNames.contains("audio")) {
          db.createObjectStore("audio", { keyPath: "filename" });
        }

        // Create metadata store for object store versioning
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "storeName" });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;

        // Metadata for object stores
        const metadataFiles: Record<string, MetadataFileConfig<unknown>> = {
          grammar: {
            bucketName: "anon-data",
            dataFile: "/grammar.json",
            metadataFile: "/grammar-metadata.json",
            convertHandler: convertBlobTextToJson<Grammar[]>,
          },
          "user-items": {
            bucketName: "anon-data",
            dataFile: "/user-items.json",
            metadataFile: "/user-items-metadata.json",
            convertHandler: convertBlobTextToJson<UserItem[]>,
          },
          audio: {
            bucketName: "anon-data",
            dataFile: "/audio.rar",
            metadataFile: "/audio-metadata.json",
            convertHandler: convertBlobZipToJson,
          },
        };

        // Sync grammar and user-items
        for (const [
          storeName,
          {
            bucketName,
            dataFile,
            metadataFile,
            convertHandler: convertHandler,
          },
        ] of Object.entries(metadataFiles)) {
          await checkAndSync(
            db,
            storeName,
            bucketName,
            metadataFile,
            dataFile,
            convertHandler
          );
        }
      };

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
      };
    }

    async function checkAndSync<T>(
      db: IDBDatabase,
      storeName: string,
      bucketName: string,
      metadataFile: string,
      dataFile: string,
      convertHandler: (data: Blob) => Promise<T>
    ) {
      const transaction = db.transaction(["metadata", storeName], "readwrite");
      const metadataStore = transaction.objectStore("metadata");
      const store = transaction.objectStore(storeName);

      // Fetch metadata
      const newfile: Blob | null = await fetchData(bucketName, metadataFile);
      if (!newfile) return;
      const metadata: Metadata | null = await convertBlobTextToJson(newfile);
      if (!metadata) return;

      const storageVersion = metadata.version;

      // Get the current version from IndexedDB
      const versionRequest = metadataStore.get(storeName);
      versionRequest.onsuccess = async () => {
        const currentVersion = versionRequest.result?.value || 0;

        if (currentVersion < storageVersion) {
          console.log(
            `Updating ${storeName} from version ${currentVersion} to ${storageVersion}...`
          );

          // Fetch new data using the provided fetch function
          const newData: Blob | null = await fetchData(bucketName, dataFile);
          if (!newData) return;

          const dataJson = await convertHandler(newData);
          if (!dataJson) {
            console.error(`Failed to convert data for ${storeName}`);
            return;
          }

          if (Array.isArray(dataJson)) {
            // TODO: Replace with updating logic
            for (const record of dataJson) {
              store.put(record);
            }
          } else {
            store.put(dataJson);
          }

          metadataStore.put({ storeName: storeName, value: storageVersion });
        } else {
          console.log(
            `${storeName} is up-to-date (version ${currentVersion}).`
          );
        }
      };
    }

    async function fetchData(
      bucketName: string,
      dataFile: string
    ): Promise<Blob | null> {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(dataFile);

      if (error) {
        console.error("Error fetching data:", error.message);
        return null;
      }

      return data;
    }

    async function convertBlobTextToJson<T>(blob: Blob): Promise<T | null> {
      try {
        const text = await blob.text();
        return JSON.parse(text);
      } catch (err) {
        console.error("Error converting Blob to JSON:", err);
        return null;
      }
    }

    async function convertBlobZipToJson(
      blob: Blob
    ): Promise<AudioRecord[] | null> {
      try {
        const zip = await JSZip.loadAsync(blob); // Load the ZIP file
        const audioRecords: AudioRecord[] = [];

        // Iterate over all files in the ZIP
        for (const fileName of Object.keys(zip.files)) {
          try {
            const file = zip.files[fileName];
            if (fileName.endsWith(".opus")) {
              const fileBlob = await file.async("blob"); // Extract file as Blob
              audioRecords.push({
                filename: fileName,
                blob: fileBlob,
              });
            }
          } catch (err) {
            console.error(`Error processing file ${fileName}:`, err);
          }
        }

        return audioRecords;
      } catch (err) {
        console.error("Error unzipping Audio ZIP file.", err);
        return null;
      }
    }

    checkAndSyncDatabase();
  }, []);
}
