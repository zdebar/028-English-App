export function setupIndexedDB(
  dbName: string,
  dbVersion: number
): IDBOpenDBRequest {
  const request = indexedDB.open(dbName, dbVersion);

  request.onupgradeneeded = () => {
    const db = request.result;

    if (!db.objectStoreNames.contains("user-items")) {
      const userItemsStore = db.createObjectStore("user-items", {
        keyPath: ["id", "user_id"],
      });

      userItemsStore.createIndex(
        "user_id_master_at_next_at",
        ["user_id", "mastered_at", "next_at"],
        {
          unique: false,
        }
      );
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
    if (!db.objectStoreNames.contains("metadata")) {
      db.createObjectStore("metadata", { keyPath: "storeName" });
    }
  };

  return request;
}
