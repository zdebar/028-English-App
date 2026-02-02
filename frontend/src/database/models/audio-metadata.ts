import { Entity } from 'dexie';
import type AppDB from '@/database/models/app-db';
import type { AudioMetadataLocal } from '@/types/local.types';
import { db } from '@/database/models/db';

/**
 * Represents metadata information for audio archives in the application database.
 *
 * The `AudioMetadata` class provides static methods to check if an audio archive
 * has already been fetched and to mark an archive as fetched by storing its metadata.
 *
 * @extends Entity<AppDB>
 * @implements AudioMetadataLocal
 *
 * @property archive_name - The unique name of the audio archive.
 * @property fetched_at - The ISO timestamp indicating when the archive was fetched.
 */
export default class AudioMetadata extends Entity<AppDB> implements AudioMetadataLocal {
  archive_name!: string;
  fetched_at!: string;

  /**
   * Checks if an audio archive has already been fetched.
   *
   * @param archiveName the name of the checked audio archive
   * @throws {Error} if database operation fails
   * @returns true if the archive has been fetched, otherwise false
   */
  static async isFetched(archiveName: string): Promise<boolean> {
    const metadata = await db.audio_metadata.get(archiveName);
    return !!metadata;
  }

  /**
   * Marks an audio archive as fetched by storing its metadata.
   *
   * @param archiveName the name of the fetched audio archive
   * @throws {Error} if database operation fails
   * @returns Promise<void>
   */
  static async markAsFetched(archiveName: string): Promise<void> {
    await db.audio_metadata.put({
      archive_name: archiveName,
      fetched_at: new Date().toISOString(),
    });
  }
}
