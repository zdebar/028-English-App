import { supabase } from "./supabase.utils";
import type { Metadata } from "../types/data.types";
import type { AudioRecord } from "../types/data.types";
import JSZip from "jszip";

export async function fetchData(
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

export async function convertDataToJson<T>(blob: Blob): Promise<T | null> {
  try {
    const text = await blob.text();
    return JSON.parse(text);
  } catch (err) {
    console.error("Error converting Blob to JSON:", err);
    return null;
  }
}

export async function unzipAndConvertToAudioRecords(
  zipFile: Blob
): Promise<AudioRecord[]> {
  const audioRecords: AudioRecord[] = [];
  const jszip = new JSZip();

  const zip = await jszip.loadAsync(zipFile);

  const filePromises = Object.keys(zip.files).map(async (filename) => {
    const file = zip.files[filename];

    if (!file.dir) {
      const blob = await file.async("blob");
      audioRecords.push({ filename, blob });
    }
  });

  await Promise.all(filePromises);
  return audioRecords;
}

export async function fetchServerMetadataVersion(
  bucketName: string,
  metadataFile: string
): Promise<number | null> {
  const newfile: Blob | null = await fetchData(bucketName, metadataFile);
  if (!newfile) return null;

  const metadataServer: Metadata | null = await convertDataToJson(newfile);
  if (!metadataServer) return null;

  return metadataServer.version;
}

export async function getCurrentVersion(
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

export async function updateMetadataStore(
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

export async function saveDataToObjectStore<T>(
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
      console.error(`Error saving data to ${storeName}:`, transaction.error);
      reject(transaction.error);
    };
  });
}
