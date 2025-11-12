import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { AudioRecordLocal } from "@/types/local.types";
import AudioMetadata from "@/database/models/audio-metadata";
import { db } from "@/database/models/db";
import config from "@/config/config";
import { fetchStorage } from "@/utils/database.utils";
import {
  validateStringArray,
  validateBlob,
  validateNonEmptyString,
} from "@/utils/validation.utils";

export default class AudioRecord
  extends Entity<AppDB>
  implements AudioRecordLocal
{
  filename!: string;
  audioBlob!: Blob;

  /**
   * Gets multiple audio records by their filenames.
   * @param keys Array of filenames to fetch.
   * @returns An array of AudioRecordLocal
   */
  static async bulkGet(keys: string[]): Promise<AudioRecordLocal[]> {
    validateStringArray(keys, "keys");

    if (keys.length === 0) return [];

    const results: (AudioRecordLocal | undefined)[] =
      await db.audio_records.bulkGet(keys);

    return results.filter((record) => record !== undefined);
  }

  /**
   * Extracts files from a zip Blob and returns them as a map of filename to Blob.
   * @param zipBlob The zip file as a Blob.
   * @returns A map where keys are filenames and values are Blobs.
   */
  static async extractZip(zipBlob: Blob): Promise<Map<string, Blob>> {
    validateBlob(zipBlob, "zipBlob");

    const extractedFiles = new Map<string, Blob>();
    const JSZip = await import("jszip");
    const zip = await JSZip.loadAsync(zipBlob);

    for (const filename of Object.keys(zip.files)) {
      const file = zip.files[filename];
      if (!file.dir) {
        const fileBlob = await file.async("blob");
        extractedFiles.set(filename, fileBlob);
      }
    }

    return extractedFiles;
  }

  /**
   * Synchronizes audio data by fetching and storing audio archives defined in the config.
   */
  static async syncAudioData(): Promise<void> {
    validateStringArray(config.audio.archives, "config.audio.archives");
    validateNonEmptyString(config.audio.bucketName, "config.audio.bucketName");

    await Promise.all(
      config.audio.archives.map(async (archiveName) => {
        try {
          // Check if the archive has already been fetched
          if (await AudioMetadata.isFetched(archiveName)) {
            return;
          }

          // Fetch the archive from storage
          const zipBlob: Blob | null = await fetchStorage(
            config.audio.bucketName,
            archiveName
          );
          if (!zipBlob) {
            console.error(`Failed to fetch archive: ${archiveName}`);
            return;
          }

          // Extract files from the zip archive
          const extractedFiles = await this.extractZip(zipBlob);

          // Store extracted files in IndexedDB
          for (const [filename, audioBlob] of extractedFiles) {
            await db.audio_records.put({ filename, audioBlob });
          }

          // Mark the archive as fetched
          await AudioMetadata.markAsFetched(archiveName);
          console.log(`Successfully synced archive: ${archiveName}`);
        } catch (error) {
          console.error(`Error syncing archive ${archiveName}:`, error);
        }
      })
    );
  }
}
