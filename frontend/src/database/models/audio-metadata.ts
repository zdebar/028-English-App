import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { AudioMetadataLocal } from '@/types/audio.types';
import { Entity } from 'dexie';

export default class AudioMetadata extends Entity<AppDB> implements AudioMetadataLocal {
  archive_name!: string;
  remote_updated_at!: string;

  /**
   * Reads the remote updated_at marker for an audio archive.
   *
   * @param archiveName Archive filename used as the local metadata key.
   * @returns Stored remote_updated_at timestamp, or null when the archive has never synced.
   */
  static async getRemoteUpdatedAt(archiveName: string): Promise<string | null> {
    const record = await db.audio_metadata.get(archiveName);
    return record?.remote_updated_at ?? null;
  }

  /**
   * Stores the remote updated_at marker after a successful archive sync.
   *
   * @param archiveName Archive filename used as the local metadata key.
   * @param remoteUpdatedAt Remote updated_at timestamp from the bucket listing.
   */
  static async markAsFetched(archiveName: string, remoteUpdatedAt: string): Promise<void> {
    await db.audio_metadata.put({
      archive_name: archiveName,
      remote_updated_at: remoteUpdatedAt,
    });
  }
}
