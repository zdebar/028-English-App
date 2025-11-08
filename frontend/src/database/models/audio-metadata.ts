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

  /**
   * Checks if an audio archive has already been fetched.
   * @param archiveName the name of the checked audio archive
   * @returns true if the archive has been fetched, otherwise false
   */
  static async isFetched(archiveName: string): Promise<boolean> {
    if (!archiveName) {
      console.error("Invalid archive name provided.");
      return false;
    }

    try {
      const metadata = await db.audio_metadata.get(archiveName);
      return !!metadata;
    } catch (error) {
      console.error(
        "Error checking if audio archive is already fetched:",
        error
      );
      return false;
    }
  }

  /**
   * Marks an audio archive as fetched by storing its metadata.
   * @param archiveName the name of the fetched audio archive
   * @returns void
   */
  static async markAsFetched(archiveName: string): Promise<void> {
    if (!archiveName) {
      console.error("Invalid archive name provided.");
      return;
    }

    try {
      const fetchedAt = new Date().toISOString();
      await db.audio_metadata.put({
        archive_name: archiveName,
        fetched_at: fetchedAt,
      });
    } catch (error) {
      console.error("Error marking archive as fetched:", error);
    }
  }
}
