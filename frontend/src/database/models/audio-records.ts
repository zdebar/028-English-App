import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import type { AudioRecordLocal } from '@/types/local.types';
import AudioMetadata from '@/database/models/audio-metadata';
import { db } from '@/database/models/db';
import config from '@/config/config';
import { fetchStorage } from '@/database/database.utils';
import { ZipExtractionError } from '@/types/error.types';
import { infoHandler } from '@/features/logging/info-handler';
import { errorHandler } from '@/features/logging/error-handler';

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
   * Synchronizes audio data from configured archives to the local database.
   *    *
   * @returns {Promise<void>} A promise that resolves when all audio archives have been synced.
   */
  static async syncAudioData(): Promise<void> {
    await Promise.all(
      config.audio.archives.map(async (archiveName) => {
        if (await AudioMetadata.isFetched(archiveName)) return;

        const zipBlob: Blob | null = await fetchStorage(config.audio.bucketName, archiveName);
        if (!zipBlob) {
          errorHandler(`Failed to fetch audio archive: ${archiveName}`, zipBlob);
          return;
        }

        const extractedFiles = await this.extractZip(zipBlob);
        await db.transaction('rw', db.audio_records, db.audio_metadata, async () => {
          await db.audio_records.bulkPut(
            Array.from(extractedFiles, ([filename, audioBlob]) => ({ filename, audioBlob })),
          );
          await AudioMetadata.markAsFetched(archiveName);
        });

        infoHandler(`Successfully synced audio archive: ${archiveName}`);
      }),
    );
  }

  // static async auditAudioData(): Promise<void> {
  //   const existingFilenames = await db.audio_records.toCollection().primaryKeys();
  //   const expectedFilenames = new Set<string>();
  // }
}
