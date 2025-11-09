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
   * @returns An array of AudioRecordLocal
   */
  static async bulkGet(keys: string[]): Promise<AudioRecordLocal[]> {
    if (!keys || keys.length === 0) return [];

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
  }
}
