import config from '@/config/config';
import type AppDB from '@/database/models/app-db';
import AudioMetadata from '@/database/models/audio-metadata';
import { db } from '@/database/models/db';
import {
  downloadStorageObject,
  fetchZipArchiveMetadata,
} from '@/database/audio/audio-storage';
import {
  summarizeSettledResults,
  withSettledSummary,
  type SyncSummary,
} from '@/features/logging/logging.utils';
import { AudioFileNotFoundError, ZipExtractionError } from '@/types/error.types';
import type { AudioRecordLocal } from '@/types/audio.types';
import { Entity } from 'dexie';
import UserItem from './user-items';

const AUDIO_DOWNLOAD_MAX_ATTEMPTS = 2;
const AUDIO_DOWNLOAD_RETRY_DELAY_MS = 100;

export type AudioArchiveSyncSummary = SyncSummary & Readonly<{
  failedArchives: readonly Readonly<{ archiveName: string; error: unknown }>[];
}>;

/**
 * Local audio blob cache backed by IndexedDB and Supabase Storage.
 *
 * Public API:
 * - `getByFilename` reads a cached blob or downloads and caches a missing file.
 * - `syncFromRemote` refreshes archive zips when remote metadata changes.
 * - `removeOrphaned` deletes cached blobs no longer referenced by user items.
 */
export default class AudioRecord extends Entity<AppDB> implements AudioRecordLocal {
  filename!: string;
  audioBlob!: Blob;

  /**
   * Gets an audio record from IndexedDB or downloads it on demand.
   *
   * @param audioName Filename/path stored on a user item.
   * @returns The local audio record; missing records are fetched from the audio bucket and cached.
   * @throws AudioFileNotFoundError when the optional audio object is absent from storage.
   * @throws SupabaseError when the fallback storage download fails for another reason.
   */
  static async getByFilename(audioName: string): Promise<AudioRecordLocal> {
    const localRecord = await db.audio_records.get(audioName);

    if (isValidAudioRecord(localRecord)) {
      return localRecord;
    }

    if (localRecord) {
      await db.audio_records.delete(audioName);
    }

    return this.fetchAudioRecord(audioName);
  }

  /** Reads unique audio cache entries with one IndexedDB request, preserving input order. */
  static async getCachedByFilenames(
    audioNames: readonly string[],
  ): Promise<Array<AudioRecordLocal | undefined>> {
    const uniqueNames = [...new Set(audioNames)];
    const localRecords = await db.audio_records.bulkGet(uniqueNames);
    const invalidNames = uniqueNames.filter((_, index) => {
      const record = localRecords[index];
      return record != null && !isValidAudioRecord(record);
    });
    if (invalidNames.length > 0) await db.audio_records.bulkDelete(invalidNames);

    const recordByName = new Map<string, AudioRecordLocal>();
    uniqueNames.forEach((filename, index) => {
      const record = localRecords[index];
      if (isValidAudioRecord(record)) recordByName.set(filename, record);
    });
    return audioNames.map((filename) => recordByName.get(filename));
  }

  /** Downloads one audio file without writing it, for a caller that batches cache writes. */
  static async downloadByFilename(audioName: string): Promise<AudioRecordLocal> {
    return {
      filename: audioName,
      audioBlob: await this.downloadAudioWithRetry(audioName),
    };
  }

  /** Stores a batch of downloaded audio files with one IndexedDB write operation. */
  static async cacheAudioRecords(records: readonly AudioRecordLocal[]): Promise<void> {
    if (records.length === 0) return;
    await db.audio_records.bulkPut([...records]);
  }

  /**
   * Synchronizes audio archives from remote storage to IndexedDB.
   *
   * @returns Summary of archive sync tasks. Archives are skipped when their remote updated_at value
   * is not newer than local audio metadata.
   * @throws SupabaseError when bucket metadata cannot be listed.
   */
  static async syncFromRemote(archiveNames?: readonly string[]): Promise<AudioArchiveSyncSummary> {
    const bucketMetadata = await fetchZipArchiveMetadata(config.audio.archiveBucketName);

    if (!bucketMetadata || bucketMetadata.size === 0) {
      return { total: 0, success: 0, failed: 0, failedArchives: [] };
    }

    const selectedArchives = Array.from(bucketMetadata.entries())
      .filter(([archiveName]) => archiveNames === undefined || archiveNames.includes(archiveName));
    const results = await Promise.allSettled(selectedArchives.map(([archiveName, remoteUpdatedAt]) =>
      this.syncArchiveFromRemote(archiveName, remoteUpdatedAt),
    ));
    const summary = summarizeSettledResults(results, 'Audio archive sync', 3, false, false);
    const failedArchives = results.flatMap((result, index) => {
      const archive = selectedArchives[index];
      if (!archive || result.status !== 'rejected') return [];
      return [{ archiveName: archive[0], error: result.reason }];
    });

    return { ...summary, failedArchives };
  }

  /**
   * Removes cached audio blobs that are no longer referenced by any user item.
   *
   * @returns Summary of delete tasks, or an empty summary when there are no orphaned records.
   */
  static async removeOrphaned(): Promise<SyncSummary> {
    const existingFilenames = await db.audio_records.toCollection().primaryKeys();
    const allUserItems = await UserItem.getAll();
    const expectedAudio = Array.from(
      new Set(allUserItems.map((item) => item.audio).filter((audio): audio is string => !!audio)),
    );

    const existingSet = new Set(existingFilenames);
    const expectedSet = new Set(expectedAudio);

    const orphaned = Array.from(existingSet).filter((x) => !expectedSet.has(x));

    if (orphaned.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    const tasks = orphaned.map((filename) => db.audio_records.delete(filename));
    return withSettledSummary(tasks, 'Remove orphaned audio', 3, false, false);
  }

  /**
   * Downloads and stores one archive when the remote version is newer than the local marker.
   *
   * @param archiveName Archive filename in the configured archive bucket.
   * @param remoteUpdatedAt Remote updated_at timestamp from the bucket listing.
   * @throws SupabaseError when archive download fails.
   * @throws ZipExtractionError when the downloaded blob cannot be read as a zip.
   */
  private static async syncArchiveFromRemote(
    archiveName: string,
    remoteUpdatedAt: string,
  ): Promise<void> {
    const localUpdatedAt = await AudioMetadata.getRemoteUpdatedAt(archiveName);
    if (localUpdatedAt && localUpdatedAt >= remoteUpdatedAt) return;

    const zipBlob = await downloadStorageObject(config.audio.archiveBucketName, archiveName);
    const extractedFiles = await this.extractZip(zipBlob);

    await db.transaction('rw', db.audio_records, db.audio_metadata, async () => {
      // bulkPut is an upsert: a newer archive intentionally replaces a blob
      // with the same filename instead of failing on the primary-key conflict.
      await db.audio_records.bulkPut(
        Array.from(extractedFiles, ([filename, audioBlob]) => ({ filename, audioBlob })),
      );
      await AudioMetadata.markAsFetched(archiveName, remoteUpdatedAt);
    });
  }

  /**
   * Extracts non-directory entries from a zip blob.
   *
   * @param zipBlob Downloaded archive blob.
   * @returns Map of archive filename to extracted audio blob.
   * @throws ZipExtractionError when JSZip cannot parse the blob.
   */
  private static async extractZip(zipBlob: Blob): Promise<Map<string, Blob>> {
    const JSZip = await import('jszip');
    let zip;
    try {
      zip = await JSZip.loadAsync(zipBlob);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? `Failed to load zip file: ${error.message}`
          : 'Failed to load zip file';
      throw new ZipExtractionError(message);
    }

    const extractedEntries = await Promise.all(
      Object.entries(zip.files)
        .filter(([, file]) => !file.dir)
        .map(async ([filename, file]) => [filename, await file.async('blob')] as const),
    );

    return new Map(extractedEntries);
  }

  /**
   * Downloads one audio file and stores it in IndexedDB.
   *
   * @param audioName Filename/path in the configured audio bucket.
   * @returns Newly cached audio record.
   * @throws AudioFileNotFoundError when the optional audio object is absent from storage.
   * @throws SupabaseError when storage download fails for another reason.
   */
  private static async fetchAudioRecord(audioName: string): Promise<AudioRecordLocal> {
    const audioRecord = await this.downloadByFilename(audioName);
    await db.audio_records.put(audioRecord);

    return audioRecord;
  }

  /**
   * Downloads one non-empty audio blob, retrying one time for transient storage failures.
   *
   * @param audioName Filename/path in the configured audio bucket.
   * @returns Downloaded audio blob.
   * @throws AudioFileNotFoundError when the optional audio object is absent from storage.
   * @throws SupabaseError when all transient storage download attempts fail.
   */
  private static async downloadAudioWithRetry(
    audioName: string,
    attempt = 1,
  ): Promise<Blob> {
    try {
      const audioBlob = await downloadStorageObject(config.audio.audioBucketName, audioName);
      if (!isValidAudioBlob(audioBlob)) {
        throw new Error(`Downloaded audio file is empty: ${audioName}`);
      }

      return audioBlob;
    } catch (error) {
      if (isMissingStorageObject(error)) {
        throw new AudioFileNotFoundError(audioName, { cause: error });
      }
      if (attempt >= AUDIO_DOWNLOAD_MAX_ATTEMPTS) {
        throw error;
      }

      await waitForAudioRetry();
      return this.downloadAudioWithRetry(audioName, attempt + 1);
    }
  }
}

function isValidAudioBlob(audioBlob: unknown): audioBlob is Blob {
  return audioBlob instanceof Blob && audioBlob.size > 0;
}

function isValidAudioRecord(audioRecord: AudioRecordLocal | undefined): audioRecord is AudioRecordLocal {
  return Boolean(audioRecord && isValidAudioBlob(audioRecord.audioBlob));
}

function waitForAudioRetry(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, AUDIO_DOWNLOAD_RETRY_DELAY_MS));
}

function isMissingStorageObject(error: unknown): boolean {
  const visited = new Set<object>();
  let current = error;

  while (typeof current === 'object' && current !== null && !visited.has(current)) {
    visited.add(current);
    const storageError = current as Readonly<{
      status?: unknown;
      cause?: unknown;
      originalError?: unknown;
    }>;
    // Supabase Storage may wrap missing-object responses as unknown errors with status 400 or 404.
    if (storageError.status === 400 || storageError.status === 404) return true;
    current = storageError.cause ?? storageError.originalError;
  }

  return false;
}
