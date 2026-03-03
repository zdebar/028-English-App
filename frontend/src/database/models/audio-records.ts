import config from '@/config/config';
import { fetchStorage } from '@/database/utils/database.utils';
import type AppDB from '@/database/models/app-db';
import AudioMetadata from '@/database/models/audio-metadata';
import { db } from '@/database/models/db';
import { infoHandler } from '@/features/logging/info-handler';
import { ZipExtractionError } from '@/types/error.types';
import type { AudioRecordLocal } from '@/types/local.types';
import { Entity } from 'dexie';
import { logRejectedResults } from '@/features/logging/logging.utils';

/**
 * Represents an audio record entity for managing audio files in the application's database.
 *
 * @method getAudioRecord - Retrieves audio record by its filename.
 * @method syncAudioData - Synchronize audio data by downloading, extracting, and storing audio archives from remote storage.
 * @method removeOrphaned - Removes audio records that are not referenced by any user items.
 */
export default class AudioRecord extends Entity<AppDB> implements AudioRecordLocal {
  filename!: string;
  audioBlob!: Blob;

  /**
   * Gets multiple audio records by their filenames.
   *
   * @param audioName The filename of the audio to fetch.
   * @returns An AudioRecordLocal
   * @throws Throws an error if the audio record cannot be found or fetched.
   */
  static async getAudioRecord(audioName: string): Promise<AudioRecordLocal | null> {
    if (!audioName) throw new Error('audioName is required in getAudioRecord');
    return (await db.audio_records.get(audioName)) ?? this.fetchAudioRecord(audioName);
  }

  /**
   * Synchronizes audio data from configured archives to the local database.
   *
   * @returns A promise allSettled when all archives have been processed.
   * @throws Logs errors for any archives that fail to sync, but continues processing remaining archives.
   */
  static async syncAudioData(archives: string[]): Promise<void> {
    const results = await Promise.allSettled(
      archives.map((archiveName) => this.syncAudioArchive(archiveName)),
    );
    logRejectedResults(results, 'Operation failed during audio data sync');
  }

  /**
   * Removes orphaned audio records from the database.
   * Orphaned records are those that exist in the audio_records table but are not referenced by any user items.
   *
   * @returns A promise that resolves when orphaned audio records are removed.
   */
  static async removeOrphaned(): Promise<void> {
    const existingFilenames = await db.audio_records.toCollection().primaryKeys();
    const allAudio = await db.user_items.toCollection().toArray();
    const expectedAudio = Array.from(
      new Set(allAudio.map((item) => item.audio).filter((audio): audio is string => !!audio)),
    );

    const existingSet = new Set(existingFilenames);
    const expectedSet = new Set(expectedAudio);

    const orphaned = Array.from(existingSet).filter((x) => !expectedSet.has(x));

    if (orphaned.length > 0) {
      await db.audio_records.bulkDelete(orphaned);
      infoHandler(`Deleted ${orphaned.length} orphaned audio records.`);
    }
  }

  /**
   * Synchronizes a single audio archive into local storage.
   *
   * @param archiveName - The name/key of the archive to download and synchronize.
   * @returns A promise that resolves when synchronization finishes (or is skipped if already fetched).
   */
  private static async syncAudioArchive(archiveName: string): Promise<void> {
    if (await AudioMetadata.isFetched(archiveName)) return;

    const zipBlob = await fetchStorage(config.audio.archiveBucketName, archiveName);
    const extractedFiles = await this.extractZip(zipBlob);

    await db.transaction('rw', db.audio_records, db.audio_metadata, async () => {
      await db.audio_records.bulkPut(
        Array.from(extractedFiles, ([filename, audioBlob]) => ({ filename, audioBlob })),
      );
      await AudioMetadata.markAsFetched(archiveName);
    });

    infoHandler(`Successfully synced audio archive: ${archiveName}`);
  }

  /**
   * Extracts files from a zip Blob and returns them as a map of filename to Blob.
   *
   * @param zipBlob The zip file as a Blob.
   * @returns A map where keys are filenames and values are Blobs.
   * @throws ZipExtractionError if extraction fails.
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
   *
   * @param audioName - The name/path of the audio file to fetch
   * @returns A promise that resolves to an object containing the filename and audio blob
   * @throws Logs an error if the audio file cannot be fetched from storage
   */
  private static async fetchAudioRecord(audioName: string): Promise<AudioRecordLocal> {
    if (!audioName) throw new Error('audioName is required');

    const audioBlob = await fetchStorage(config.audio.audioBucketName, audioName);
    await db.audio_records.put({ filename: audioName, audioBlob });
    infoHandler(`Successfully synced audio file: ${audioName}`);

    return { filename: audioName, audioBlob };
  }
}
