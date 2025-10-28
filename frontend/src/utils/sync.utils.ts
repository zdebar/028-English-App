import {
  fetchData,
  convertDataToJson,
  fetchServerMetadataVersion,
  getCurrentVersion,
  saveDataToObjectStore,
  updateMetadataStore,
  unzipAndConvertToAudioRecords,
} from "./helper.utils";

export async function checkAndSync<T>(
  db: IDBDatabase,
  storeName: string,
  bucketName: string,
  dataFile: string,
  metadataFile: string
): Promise<void> {
  const serverVersion = await fetchServerMetadataVersion(
    bucketName,
    metadataFile
  );
  if (serverVersion === null) return;

  const currentVersion = await getCurrentVersion(db, storeName);
  if (currentVersion === null) return;

  console.log(
    `Checking ${storeName}: current version ${currentVersion}, server version ${serverVersion}`
  );

  if (currentVersion < serverVersion) {
    const newData: Blob | null = await fetchData(bucketName, dataFile);
    if (!newData) return;

    const dataJson = await convertDataToJson<T>(newData);
    if (!dataJson) return;

    await saveDataToObjectStore(db, storeName, dataJson);
    await updateMetadataStore(db, storeName, serverVersion);

    console.log(`Updated ${storeName} to version ${serverVersion}.`);
  } else {
    console.log(`${storeName} is up-to-date (version ${serverVersion}).`);
  }
}

export async function checkAndSyncAudio(
  db: IDBDatabase,
  storeName: string,
  bucketName: string,
  dataFile: string,
  metadataFile: string
): Promise<void> {
  const serverVersion = await fetchServerMetadataVersion(
    bucketName,
    metadataFile
  );
  if (serverVersion === null) return;

  const currentVersion = await getCurrentVersion(db, storeName);
  if (currentVersion === null) return;

  console.log(
    `Checking ${storeName}: current version ${currentVersion}, server version ${serverVersion}`
  );

  if (currentVersion < serverVersion) {
    const newData: Blob | null = await fetchData(bucketName, dataFile);
    if (!newData) return;

    const dataJson = await unzipAndConvertToAudioRecords(newData);
    if (!dataJson) return;

    await saveDataToObjectStore(db, storeName, dataJson);
    await updateMetadataStore(db, storeName, serverVersion);

    console.log(`Updated ${storeName} to version ${serverVersion}.`);
  } else {
    console.log(`${storeName} is up-to-date (version ${serverVersion}).`);
  }
}
