import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { AudioRecordLocal } from "@/types/local.types";
import AudioMetadata from "@/database/models/audio-metadata";
import { db } from "@/database/models/db";
import config from "@/config/config";
import { fetchStorage } from "@/utils/helper.utils";

export default class AudioRecord
  extends Entity<AppDB>
  implements AudioRecordLocal
{
  filename!: string;
  audioBlob!: Blob;

  // Fetch a single record by ID
  static async getAudio(
    filename: string
  ): Promise<AudioRecordLocal | undefined> {
    return await db.audio_records.get(filename);
  }

  // Save or update multiple Grammar records
  static async saveAll(audioFiles: AudioRecordLocal[]) {
    return await db.audio_records.bulkPut(audioFiles);
  }

  // Helper method to extract files from a zip blob
  static async extractZip(zipBlob: Blob): Promise<Map<string, Blob>> {
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

  static async syncAudioData(): Promise<void> {
    try {
      // Step 1: Compare config.audioArchives with metadata
      for (const archiveName of config.audioArchives) {
        const isFetched = await AudioMetadata.isFetched(archiveName);

        if (isFetched) {
          console.log(`Archive ${archiveName} already fetched. Skipping.`);
          continue;
        }

        console.log(`Fetching archive: ${archiveName}`);

        // Step 2: Fetch the archive from storage
        const zipBlob: Blob | null = await fetchStorage(
          config.audioBucketName,
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
        console.log(`Marked ${archiveName} as fetched in metadata.`);
      }
    } catch (error) {
      console.error("Error during audio sync:", error);
    }
  }
}
