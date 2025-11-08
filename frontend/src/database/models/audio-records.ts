import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { AudioRecordLocal } from "@/types/local.types";
import AudioMetadata from "@/database/models/audio-metadata";
import { db } from "@/database/models/db";
import config from "@/config/config";
import { fetchStorage } from "@/utils/database.utils";

export default class AudioRecord
  extends Entity<AppDB>
  implements AudioRecordLocal
{
  filename!: string;
  audioBlob!: Blob;

  /**
   * Gets multiple audio records by their filenames.
   * @param keys Array of filenames to fetch.
   * @returns An array of AudioRecordLocal or undefined
   */
  static async bulkGet(keys: string[]): Promise<AudioRecordLocal[]> {
    if (!Array.isArray(keys) || keys.length === 0) {
      console.error("Invalid keys array provided.");
      return [];
    }

    try {
      const results: (AudioRecordLocal | undefined)[] =
        await db.audio_records.bulkGet(keys);
      return results.filter((record) => record !== undefined);
    } catch (error) {
      console.error("Error fetching bulk audio records:", error);
      return [];
    }
  }

  /**
   * Extracts files from a zip Blob and returns them as a map of filename to Blob.
   * @param zipBlob The zip file as a Blob.
   * @returns A map where keys are filenames and values are Blobs.
   */
  static async extractZip(zipBlob: Blob): Promise<Map<string, Blob>> {
    if (!(zipBlob instanceof Blob)) {
      console.error("Invalid zipBlob provided.");
      return new Map();
    }

    try {
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
    } catch (error) {
      console.error("Error extracting zip file:", error);
      return new Map();
    }
  }

  /**
   * Synchronizes audio data by fetching archives, extracting files, and saving them to the database.
   */
  static async syncAudioData(): Promise<void> {
    try {
      await Promise.all(
        config.audio.archives.map(async (archiveName) => {
          if (await AudioMetadata.isFetched(archiveName)) {
            return;
          }

          const zipBlob: Blob | null = await fetchStorage(
            config.audio.bucketName,
            archiveName
          );
          if (!zipBlob) return;

          const extractedFiles = await this.extractZip(zipBlob);

          for (const [filename, audioBlob] of extractedFiles) {
            await db.audio_records.put({ filename, audioBlob });
          }

          await AudioMetadata.markAsFetched(archiveName);
        })
      );
    } catch (error) {
      console.error("Error during audio sync:", error);
    }
  }
}
