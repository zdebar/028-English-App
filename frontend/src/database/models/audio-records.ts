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

  // Fetch multiple records by their IDs
  static async bulkGet(
    keys: string[]
  ): Promise<(AudioRecordLocal | undefined)[]> {
    try {
      return await db.audio_records.bulkGet(keys);
    } catch (error) {
      console.error("Error fetching bulk audio records:", error);
      return [];
    }
  }

  // Helper method to extract files from a zip blob
  static async extractZip(zipBlob: Blob): Promise<Map<string, Blob>> {
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

  static async syncAudioData(): Promise<void> {
    try {
      for (const archiveName of config.audio.archives) {
        // Step 1: Compare config.audioArchives with metadata
        if (await AudioMetadata.isFetched(archiveName)) {
          continue;
        }

        // Step 2: Fetch the archive from storage
        const zipBlob: Blob | null = await fetchStorage(
          config.audio.bucketName,
          archiveName
        );
        if (!zipBlob) return;

        // Step 3: Extract files from the zip
        const extractedFiles = await this.extractZip(zipBlob);

        // Step 4: Save files to IndexedDB
        for (const [filename, audioBlob] of extractedFiles) {
          await db.audio_records.put({ filename, audioBlob });
        }

        // Step 5: Save archive metadata immediately
        await AudioMetadata.markAsFetched(archiveName);
      }
    } catch (error) {
      console.error("Error during audio sync:", error);
    }
  }
}
