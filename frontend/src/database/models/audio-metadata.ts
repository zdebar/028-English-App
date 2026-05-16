import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { AudioMetadataLocal } from '@/types/audio.types';
import { Entity } from 'dexie';

/**
 * Represents metadata information for audio archives in the application database.
 *
 * @method getRemoteUpdatedAt - Returns the remote updated_at timestamp stored from the last sync, or null if never synced.
 * @method markAsFetched - Stores the remote updated_at timestamp for an archive after a successful sync.
 */
export default class AudioMetadata extends Entity<AppDB> implements AudioMetadataLocal {
  archive_name!: string;
  remote_updated_at!: string;

  /**
   * Returns the remote updated_at timestamp stored from the last sync.
   * @param archiveName the name of the audio archive
   * @returns the stored remote_updated_at string, or null if the archive has never been synced
   */
  static async getRemoteUpdatedAt(archiveName: string): Promise<string | null> {
    const record = await db.audio_metadata.get(archiveName);
    return record?.remote_updated_at ?? null;
  }

  /**
   * Stores the remote file's updated_at timestamp after a successful sync.
   * @param archiveName the name of the synced audio archive
   * @param remoteUpdatedAt the updated_at timestamp of the remote file at sync time
   */
  static async markAsFetched(archiveName: string, remoteUpdatedAt: string): Promise<void> {
    await db.audio_metadata.put({
      archive_name: archiveName,
      remote_updated_at: remoteUpdatedAt,
    });
  }
}
