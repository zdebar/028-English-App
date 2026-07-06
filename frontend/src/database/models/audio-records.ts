import config from '@/config/config';
import type AppDB from '@/database/models/app-db';
import AudioMetadata from '@/database/models/audio-metadata';
import { db } from '@/database/models/db';
import { fetchStorage, fetchStorageBucketMetadata } from '@/database/utils/audio-records.utils';
import { withSettledSummary, type SyncSummary } from '@/features/logging/logging.utils';
import { ZipExtractionError } from '@/types/error.types';
import type { AudioRecordLocal } from '@/types/audio.types';
import { Entity } from 'dexie';
import UserItem from './user-items';

export default class AudioRecord extends Entity<AppDB> implements AudioRecordLocal {
  filename!: string;
  audioBlob!: Blob;

  /**
   * Gets an audio record from IndexedDB or downloads it on demand.
   *
   * @param audioName Filename/path stored on a user item.
   * @returns The local audio record; missing records are fetched from the audio bucket and cached.
   * @throws SupabaseError when the fallback storage download fails.
   */
  static async getByFilename(audioName: string): Promise<AudioRecordLocal> {
    return (await db.audio_records.get(audioName)) ?? this.fetchAudioRecord(audioName);
  }

  /**
   * Synchronizes audio archives from remote storage to IndexedDB.
   *
   * @returns Summary of archive sync tasks. Archives are skipped when their remote updated_at value
   * is not newer than local audio metadata.
   * @throws SupabaseError when bucket metadata cannot be listed.
   */
  static async syncFromRemote(): Promise<SyncSummary> {
    const bucketMetadata = await fetchStorageBucketMetadata(config.audio.archiveBucketName);

    if (!bucketMetadata || bucketMetadata.size === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    return withSettledSummary(
      Array.from(bucketMetadata.entries(), ([archiveName, remoteUpdatedAt]) =>
        this.syncArchiveFromRemote(archiveName, remoteUpdatedAt),
      ),
      'Audio archive sync',
      3,
      false,
    );
  }

  /**
   * Removes cached audio blobs that are no longer referenced by any user item.
   *
   * @returns Summary of delete tasks, or an empty summary when there are no orphaned records.
   */
  static async removeOrphaned(): Promise<SyncSummary> {
    const existingFilenames = await db.audio_records.toCollection().primaryKeys();
    const allUserItems = await UserItem.getAll();
    const expectedAudio = Array.from(
      new Set(allUserItems.map((item) => item.audio).filter((audio): audio is string => !!audio)),
    );

    const existingSet = new Set(existingFilenames);
    const expectedSet = new Set(expectedAudio);

    const orphaned = Array.from(existingSet).filter((x) => !expectedSet.has(x));

    if (orphaned.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    const tasks = orphaned.map((filename) => db.audio_records.delete(filename));
    return withSettledSummary(tasks, 'Remove orphaned audio', 3, false);
  }

  /**
   * Downloads and stores one archive when the remote version is newer than the local marker.
   *
   * @param archiveName Archive filename in the configured archive bucket.
   * @param remoteUpdatedAt Remote updated_at timestamp from the bucket listing.
   * @throws SupabaseError when archive download fails.
   * @throws ZipExtractionError when the downloaded blob cannot be read as a zip.
   */
  private static async syncArchiveFromRemote(
    archiveName: string,
    remoteUpdatedAt: string,
  ): Promise<void> {
    const localUpdatedAt = await AudioMetadata.getRemoteUpdatedAt(archiveName);
    if (localUpdatedAt && localUpdatedAt >= remoteUpdatedAt) return;

    const zipBlob = await fetchStorage(config.audio.archiveBucketName, archiveName);
    const extractedFiles = await this.extractZip(zipBlob);

    await db.transaction('rw', db.audio_records, db.audio_metadata, async () => {
      await db.audio_records.bulkPut(
        Array.from(extractedFiles, ([filename, audioBlob]) => ({ filename, audioBlob })),
      );
      await AudioMetadata.markAsFetched(archiveName, remoteUpdatedAt);
    });
  }

  /**
   * Extracts non-directory entries from a zip blob.
   *
   * @param zipBlob Downloaded archive blob.
   * @returns Map of archive filename to extracted audio blob.
   * @throws ZipExtractionError when JSZip cannot parse the blob.
   */
  private static async extractZip(zipBlob: Blob): Promise<Map<string, Blob>> {
    const extractedFiles = new Map<string, Blob>();
    const JSZip = await import('jszip');
    let zip;
    try {
      zip = await JSZip.loadAsync(zipBlob);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? `Failed to load zip file: ${error.message}`
          : 'Failed to load zip file';
      throw new ZipExtractionError(message);
    }

    for (const filename of Object.keys(zip.files)) {
      const file = zip.files[filename];
      if (!file.dir) {
        const fileBlob = await file.async('blob');
        extractedFiles.set(filename, fileBlob);
      }
    }

    return extractedFiles;
  }

  /**
   * Downloads one audio file and stores it in IndexedDB.
   *
   * @param audioName Filename/path in the configured audio bucket.
   * @returns Newly cached audio record.
   * @throws SupabaseError when storage download fails.
   */
  private static async fetchAudioRecord(audioName: string): Promise<AudioRecordLocal> {
    const audioBlob = await fetchStorage(config.audio.audioBucketName, audioName);
    await db.audio_records.put({ filename: audioName, audioBlob });

    return { filename: audioName, audioBlob };
  }
}
