import { useEffect } from "react";
import type { Metadata, UserItem } from "../types/data.types";
import { supabase } from "../utils/supabase";

interface MetadataFileConfig {
  bucketName: string;
  dataFile: string;
  metadataFile: string;
}

export function useDataSync() {
  useEffect(() => {
    async function checkAndSyncData() {
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
          db.createObjectStore("grammar", { keyPath: "grammar_id" });
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
        const metadataFiles: Record<string, MetadataFileConfig> = {
          grammar: {
            bucketName: "anon-data",
            dataFile: "/grammar.json",
            metadataFile: "/grammar-metadata.json",
          },
          "user-items": {
            bucketName: "anon-data",
            dataFile: "/user-items.json",
            metadataFile: "/user-items-metadata.json",
          },
        };

        for (const [storeName, config] of Object.entries(metadataFiles)) {
          await checkAndSync(
            db,
            storeName,
            config.bucketName,
            config.dataFile,
            config.metadataFile
          );
        }
      };

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
      };
    }

    async function checkAndSync(
      db: IDBDatabase,
      storeName: string,
      bucketName: string,
      dataFile: string,
      metadataFile: string
    ) {
      // Fetch metadata from server
      const serverVersion = await fetchServerMetadata(bucketName, metadataFile);
      if (serverVersion === null) return;

      // Get the current version from IndexedDB
      const currentVersion = await getCurrentVersion(db, storeName);
      if (currentVersion === null) return;

      console.log(
        `Checking ${storeName}: current version ${currentVersion}, server version ${serverVersion}`
      );

      if (currentVersion < serverVersion) {
        // Fetch new data using the provided fetch function
        const newData: Blob | null = await fetchData(bucketName, dataFile);
        if (!newData) return;

        const dataJson = await convertBlobTextToJson(newData);
        if (!dataJson) return;

        await saveDataToObjectStore(db, storeName, dataJson);

        await updateMetadataStore(db, storeName, serverVersion);
        console.log(`Updated ${storeName} to version ${serverVersion}.`);
      } else {
        console.log(`${storeName} is up-to-date (version ${serverVersion}).`);
      }
    }

    async function fetchServerMetadata(
      bucketName: string,
      metadataFile: string
    ): Promise<number | null> {
      const newfile: Blob | null = await fetchData(bucketName, metadataFile);
      if (!newfile) return null;

      const metadataServer: Metadata | null = await convertBlobTextToJson(
        newfile
      );
      if (!metadataServer) return null;
      return metadataServer.version;
    }

    async function getCurrentVersion(
      db: IDBDatabase,
      storeName: string
    ): Promise<number | null> {
      return new Promise<number>((resolve, reject) => {
        const transaction = db.transaction("metadata", "readonly");
        const metadataStore = transaction.objectStore("metadata");
        const versionRequest = metadataStore.get(storeName);

        versionRequest.onsuccess = () => {
          const result = versionRequest.result;
          if (result) {
            resolve(result.value);
          } else {
            resolve(0);
          }
        };

        versionRequest.onerror = () => {
          console.error("Error fetching current version from IndexedDB");
          reject(versionRequest.error);
        };
      });
    }

    async function fetchData(
      bucketName: string,
      dataFile: string
    ): Promise<Blob | null> {
      const cacheBuster = `?t=${Date.now()}`;
      const filePath = dataFile.replace(/^\//, "") + cacheBuster;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

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

    async function saveDataToObjectStore<T>(
      db: IDBDatabase,
      storeName: string,
      dataJson: T
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);

        console.log("Saving data to store:", storeName, dataJson);

        if (Array.isArray(dataJson)) {
          for (const record of dataJson) {
            store.put(record);
          }
        } else {
          store.put(dataJson);
        }

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          console.error(
            `Error saving data to ${storeName}:`,
            transaction.error
          );
          reject(transaction.error);
        };
      });
    }

    async function updateUserItemsInObjectStore(
      db: IDBDatabase,
      storeName: string,
      dataJson: UserItem | UserItem[]
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);

        console.log("Updating data in store:", storeName, dataJson);

        if (Array.isArray(dataJson)) {
          for (const record of dataJson) {
            const getRequest = store.get(record.id);
            getRequest.onsuccess = () => {
              const existingRecord = getRequest.result;

              const updatedRecord = {
                ...existingRecord,
                ...record,
                progress: existingRecord?.progress ?? 0,
                started_at: existingRecord?.started_at ?? null,
                updated_at: existingRecord?.updated_at ?? null,
                next_at: existingRecord?.next_at ?? null,
                learned_at: existingRecord?.learned_at ?? null,
                mastered_at: existingRecord?.mastered_at ?? null,
              };

              store.put(updatedRecord);
            };

            getRequest.onerror = () => {
              console.error(
                `Error fetching existing record for id ${record.id}`
              );
            };
          }
        } else {
          const getRequest = store.get(dataJson.id);
          getRequest.onsuccess = () => {
            const existingRecord = getRequest.result;

            const updatedRecord = {
              ...existingRecord,
              ...dataJson,
              progress: existingRecord?.progress ?? 0,
              started_at: existingRecord?.started_at ?? null,
              updated_at: existingRecord?.updated_at ?? null,
              next_at: existingRecord?.next_at ?? null,
              learned_at: existingRecord?.learned_at ?? null,
              mastered_at: existingRecord?.mastered_at ?? null,
            };

            store.put(updatedRecord);
          };

          getRequest.onerror = () => {
            console.error(
              `Error fetching existing record for id ${dataJson.id}`
            );
          };
        }

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          console.error(
            `Error updating data in ${storeName}:`,
            transaction.error
          );
          reject(transaction.error);
        };
      });
    }

    async function updateMetadataStore(
      db: IDBDatabase,
      storeName: string,
      version: number
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("metadata", "readwrite");
        const metadataStore = transaction.objectStore("metadata");

        metadataStore.put({ storeName, value: version });

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          console.error(
            `Error updating metadata for ${storeName}:`,
            transaction.error
          );
          reject(transaction.error);
        };
      });
    }

    checkAndSyncData();
  }, []);
}
