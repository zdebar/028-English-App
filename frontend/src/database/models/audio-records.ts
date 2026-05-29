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

/**
 * Represents an audio record entity for managing audio files in the application's database.
 *
 * @method getByFilename - Retrieves audio record by its filename.
 * @method syncFromRemote - Synchronize audio data by downloading, extracting, and storing audio archives from remote storage.
 * @method removeOrphaned - Removes audio records that are not referenced by any user items.
 */
export default class AudioRecord extends Entity<AppDB> implements AudioRecordLocal {
  filename!: string;
  audioBlob!: Blob;

  /**
   * Gets an audio record by its filename.
   * @param audioName The filename of the audio to fetch.
   */
  static async getByFilename(audioName: string): Promise<AudioRecordLocal> {
    return (await db.audio_records.get(audioName)) ?? this.fetchAudioRecord(audioName);
  }

  /**
   * Synchronizes all audio archives from the remote bucket to local storage.
   * Fetches the bucket file list once, then downloads only files newer than the locally stored version.
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
   * Removes orphaned audio records from the database.
   * Orphaned records are those that exist in the audio_records table but are not referenced by any user items.
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
   * Synchronizes a single audio archive into local storage.
   * Downloads only if the remote file is newer than the locally stored version.
   * @param archiveName - The name/key of the archive to download and synchronize.
   * @param remoteUpdatedAt - The remote file's updated_at timestamp from the bucket listing.
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
   * Extracts files from a zip Blob and returns them as a map of filename to Blob.
   * @param zipBlob The zip file as a Blob.
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
   * Fetches an audio file from storage and stores it in the local database.
   * @param audioName - The name/path of the audio file to fetch
   */
  private static async fetchAudioRecord(audioName: string): Promise<AudioRecordLocal> {
    const audioBlob = await fetchStorage(config.audio.audioBucketName, audioName);
    await db.audio_records.put({ filename: audioName, audioBlob });

    return { filename: audioName, audioBlob };
  }
}
