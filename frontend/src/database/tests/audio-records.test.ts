import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  audioGet: vi.fn(),
  audioPut: vi.fn(),
  audioBulkPut: vi.fn(),
  audioBulkDelete: vi.fn(),
  audioPrimaryKeys: vi.fn(),
  userItemsToArray: vi.fn(),
  dbTransaction: vi.fn(),
  fetchStorage: vi.fn(),
  metadataIsFetched: vi.fn(),
  metadataMarkAsFetched: vi.fn(),
  infoHandler: vi.fn(),
  logRejectedResults: vi.fn(),
  jszipLoadAsync: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
      nullReplacementNumber: 0,
      epochStartDate: '1970-01-01T00:00:00.000Z',
    },
    audio: {
      audioBucketName: 'audio-bucket',
      archiveBucketName: 'archive-bucket',
    },
  },
}));

vi.mock('@/database/utils/database.utils', () => ({
  fetchStorage: (...args: unknown[]) => mocks.fetchStorage(...args),
}));

vi.mock('@/database/models/audio-metadata', () => ({
  default: {
    isFetched: (...args: unknown[]) => mocks.metadataIsFetched(...args),
    markAsFetched: (...args: unknown[]) => mocks.metadataMarkAsFetched(...args),
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    audio_records: {
      get: (...args: unknown[]) => mocks.audioGet(...args),
      put: (...args: unknown[]) => mocks.audioPut(...args),
      bulkPut: (...args: unknown[]) => mocks.audioBulkPut(...args),
      bulkDelete: (...args: unknown[]) => mocks.audioBulkDelete(...args),
      toCollection: () => ({
        primaryKeys: () => mocks.audioPrimaryKeys(),
      }),
    },
    user_items: {
      toCollection: () => ({
        toArray: () => mocks.userItemsToArray(),
      }),
    },
    audio_metadata: {},
    transaction: (...args: unknown[]) => mocks.dbTransaction(...args),
  },
}));

vi.mock('@/features/logging/info-handler', () => ({
  infoHandler: (...args: unknown[]) => mocks.infoHandler(...args),
}));

vi.mock('@/features/logging/logging.utils', () => ({
  logRejectedResults: (...args: unknown[]) => mocks.logRejectedResults(...args),
}));

vi.mock('jszip', () => ({
  loadAsync: (...args: unknown[]) => mocks.jszipLoadAsync(...args),
}));

import AudioRecord from '@/database/models/audio-records';

describe('AudioRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbTransaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>;
      return callback();
    });
  });

  describe('getAudio', () => {
    it('attempts remote fetch when audioName is empty and no cache exists', async () => {
      mocks.audioGet.mockResolvedValue(undefined);
      mocks.fetchStorage.mockRejectedValue(new Error('Data file name is required'));

      await expect(AudioRecord.getRecord('')).rejects.toThrow('Data file name is required');
      expect(mocks.audioGet).toHaveBeenCalledWith('');
    });

    it('returns existing local record when present', async () => {
      const existing = { filename: 'a.opus', audioBlob: new Blob(['cached']) };
      mocks.audioGet.mockResolvedValue(existing);

      const result = await AudioRecord.getRecord('a.opus');

      expect(mocks.audioGet).toHaveBeenCalledWith('a.opus');
      expect(mocks.fetchStorage).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('fetches from storage and persists when not cached', async () => {
      const blob = new Blob(['fresh']);
      mocks.audioGet.mockResolvedValue(undefined);
      mocks.fetchStorage.mockResolvedValue(blob);

      const result = await AudioRecord.getRecord('b.opus');

      expect(mocks.fetchStorage).toHaveBeenCalledWith('audio-bucket', 'b.opus');
      expect(mocks.audioPut).toHaveBeenCalledWith({ filename: 'b.opus', audioBlob: blob });
      expect(result).toEqual({ filename: 'b.opus', audioBlob: blob });
    });
  });

  describe('syncAudioData', () => {
    it('skips archive download when already fetched', async () => {
      mocks.metadataIsFetched.mockResolvedValue(true);

      await AudioRecord.syncFromRemote(['pack-1.zip', 'pack-2.zip']);

      expect(mocks.metadataIsFetched).toHaveBeenCalledTimes(2);
      expect(mocks.fetchStorage).not.toHaveBeenCalled();
      expect(mocks.audioBulkPut).not.toHaveBeenCalled();
      expect(mocks.metadataMarkAsFetched).not.toHaveBeenCalled();
    });

    it('downloads, extracts, stores files, and marks archive as fetched', async () => {
      const zipBlob = new Blob(['zip']);
      const extractedBlob = new Blob(['audio']);
      const fileAsync = vi.fn().mockResolvedValue(extractedBlob);

      mocks.metadataIsFetched.mockResolvedValue(false);
      mocks.fetchStorage.mockResolvedValue(zipBlob);
      mocks.jszipLoadAsync.mockResolvedValue({
        files: {
          'word.opus': { dir: false, async: fileAsync },
          'folder/': { dir: true, async: vi.fn() },
        },
      });

      await AudioRecord.syncFromRemote(['pack-3.zip']);

      expect(mocks.fetchStorage).toHaveBeenCalledWith('archive-bucket', 'pack-3.zip');
      expect(mocks.audioBulkPut).toHaveBeenCalledWith([
        { filename: 'word.opus', audioBlob: extractedBlob },
      ]);
      expect(mocks.metadataMarkAsFetched).toHaveBeenCalledWith('pack-3.zip');
    });

    it('logs and swallows archive sync errors', async () => {
      const error = new Error('network error');
      mocks.metadataIsFetched.mockResolvedValue(false);
      mocks.fetchStorage.mockRejectedValue(error);

      await expect(AudioRecord.syncFromRemote(['broken-pack.zip'])).resolves.toBeUndefined();

      expect(mocks.logRejectedResults).toHaveBeenCalledWith(
        expect.any(Array),
        'Operation failed during audio data sync',
      );
    });
  });

  describe('removeOrphaned', () => {
    it('deletes orphaned audio records when they exist', async () => {
      mocks.audioPrimaryKeys.mockResolvedValue(['a.opus', 'b.opus', 'c.opus']);
      mocks.userItemsToArray.mockResolvedValue([
        { audio: 'a.opus' },
        { audio: '' },
        { audio: null },
        { audio: 'a.opus' },
      ]);

      await AudioRecord.removeOrphaned();

      expect(mocks.audioBulkDelete).toHaveBeenCalledWith(['b.opus', 'c.opus']);
    });

    it('does not delete when there are no orphaned records', async () => {
      mocks.audioPrimaryKeys.mockResolvedValue(['a.opus']);
      mocks.userItemsToArray.mockResolvedValue([{ audio: 'a.opus' }]);

      await AudioRecord.removeOrphaned();

      expect(mocks.audioBulkDelete).not.toHaveBeenCalled();
    });
  });
});
