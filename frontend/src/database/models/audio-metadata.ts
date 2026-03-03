import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { AudioMetadataLocal } from '@/types/local.types';
import { Entity } from 'dexie';

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
   * @param archiveName the name of the checked audio archive
   * @returns true if the archive has been already fetched, otherwise false
   */
  static async isFetched(archiveName: string): Promise<boolean> {
    if (!archiveName) throw new Error('archiveName is required in isFetched');
    return !!(await db.audio_metadata.get(archiveName));
  }

  /**
   * Marks an audio archive as fetched by storing its metadata.
   *
   * @param archiveName the name of the fetched audio archive
   */
  static async markAsFetched(archiveName: string): Promise<void> {
    if (!archiveName) throw new Error('archiveName is required in markAsFetched');
    await db.audio_metadata.put({
      archive_name: archiveName,
      fetched_at: new Date().toISOString(),
    });
  }
}
