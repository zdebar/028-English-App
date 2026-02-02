import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import type { AudioRecordLocal } from '@/types/local.types';
import AudioMetadata from '@/database/models/audio-metadata';
import { db } from '@/database/models/db';
import config from '@/config/config';
import { fetchStorage } from '@/database/database.utils';

/**
 * Represents an audio record entity for managing audio files in the application's database.
 *
 * @method bulkGet - Retrieves multiple audio records by their filenames.
 * @method extractZip - Extracts files from a zip Blob and returns them as a map of filename to Blob.
 * @method syncAudioData - Synchronize audio data by downloading, extracting, and storing audio archives from remote storage.
 */
export default class AudioRecord extends Entity<AppDB> implements AudioRecordLocal {
  filename!: string;
  audioBlob!: Blob;

  /**
   * Gets multiple audio records by their filenames.
   *
   * @param keys Array of filenames to fetch.
   * @returns An array of AudioRecordLocal
   * @throws Error if database operation fails. Nonexistent keys are simply omitted from the result.
   */
  static async bulkGet(keys: string[]): Promise<AudioRecordLocal[]> {
    if (keys.length === 0) return [];

    const results: (AudioRecordLocal | undefined)[] = await db.audio_records.bulkGet(keys);

    return results.filter((record): record is AudioRecordLocal => record !== undefined);
  }

  /**
   * Extracts files from a zip Blob and returns them as a map of filename to Blob.
   *
   * @param zipBlob The zip file as a Blob.
   * @returns A map where keys are filenames and values are Blobs.
   * @throws Error if extraction fails.
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
      throw new Error(message);
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
   * Synchronizes audio data.
   * - List of audio archives is defined in config.
   * - Checks which audio archives have already been fetched.
   * - Downloads audio archives from remote storage.
   * - Extracts audio files from the downloaded archives.
   * - Stores extracted audio files in IndexedDB.
   *
   * @returns Promise<void>
   */
  static async syncAudioData(): Promise<void> {
    await Promise.all(
      config.audio.archives.map(async (archiveName) => {
        try {
          // Check if the archive has already been fetched
          if (await AudioMetadata.isFetched(archiveName)) {
            return;
          }

          // Fetch the archive from storage
          const zipBlob: Blob | null = await fetchStorage(config.audio.bucketName, archiveName);
          if (!zipBlob) {
            console.error(`Failed to fetch audio archive: ${archiveName}`);
            return;
          }

          // Extract files from the zip archive
          const extractedFiles = await this.extractZip(zipBlob);

          // Store extracted files in IndexedDB
          const putPromises = Array.from(extractedFiles).map(([filename, audioBlob]) =>
            db.audio_records.put({ filename, audioBlob }),
          );
          await Promise.all(putPromises);

          // Mark the archive as fetched -- TODO: still marks all as fetched even if some fail
          await AudioMetadata.markAsFetched(archiveName);
          console.log(`Successfully synced audio archive: ${archiveName}`);
        } catch (error) {
          console.error(`Error syncing audio archive ${archiveName}:`, error);
        }
      }),
    );
  }
}
