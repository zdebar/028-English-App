import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { AudioMetadataLocal } from '@/types/local.types';
import { Entity } from 'dexie';
import { DatabaseError } from '@/types/error.types';

/**
 * Represents metadata information for audio archives in the application database.
 *
 * @method isFetched - Checks if an audio archive has been fetched.
 * @method markAsFetched - Marks an audio archive as fetched by storing its metadata.
 */
export default class AudioMetadata extends Entity<AppDB> implements AudioMetadataLocal {
  archive_name!: string;
  fetched_at!: string;

  /**
   * Checks if an audio archive has already been fetched.
   *
   * @static
   * @param archiveName the name of the checked audio archive
   * @throws DatabaseError, if database operation fails
   * @returns true if the archive has been already fetched, otherwise false
   */
  static async isFetched(archiveName: string): Promise<boolean> {
    const metadata = await db.audio_metadata.get(archiveName).catch((error) => {
      throw new DatabaseError('Audio archive name fetching failed', error, { archiveName });
    });
    return !!metadata;
  }

  /**
   * Marks an audio archive as fetched by storing its metadata.
   *
   * @static
   * @param archiveName the name of the fetched audio archive
   * @throws DatabaseError, if database operation fails
   * @returns true if the archive has been successfully marked as fetched, otherwise throws an error
   */
  static async markAsFetched(archiveName: string): Promise<boolean> {
    await db.audio_metadata
      .put({
        archive_name: archiveName,
        fetched_at: new Date().toISOString(),
      })
      .catch((error) => {
        throw new DatabaseError(`Audio archive name marking as fetched failed`, error, {
          archiveName,
        });
      });
    return true;
  }
}
