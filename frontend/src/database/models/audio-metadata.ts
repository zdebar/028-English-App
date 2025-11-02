import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import type { AudioMetadataLocal } from "@/types/local.types";
import { db } from "@/database/models/db";

export default class AudioMetadata
  extends Entity<AppDB>
  implements AudioMetadataLocal
{
  archive_name!: string;
  fetched_at!: string;

  // Static method to check if an archive has already been fetched
  static async isFetched(archiveName: string): Promise<boolean> {
    const metadata = await db.audio_metadata.get(archiveName);
    return !!metadata;
  }

  // Static method to mark an archive as fetched
  static async markAsFetched(archiveName: string): Promise<void> {
    const fetchedAt = new Date().toISOString();
    await db.audio_metadata.put({
      archive_name: archiveName,
      fetched_at: fetchedAt,
    });
  }

  // Static method to get all fetched archives
  static async getAllFetched(): Promise<AudioMetadata[]> {
    return await db.audio_metadata.toArray();
  }
}
