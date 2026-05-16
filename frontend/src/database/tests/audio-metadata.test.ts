import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, putMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    audio_metadata: {
      get: getMock,
      put: putMock,
    },
  },
}));

import AudioMetadata from '@/database/models/audio-metadata';

describe('AudioMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getRemoteUpdatedAt', () => {
    it('returns the stored remote_updated_at when metadata exists', async () => {
      getMock.mockResolvedValue({
        archive_name: 'archive-1.zip',
        remote_updated_at: '2026-05-01T10:00:00.000Z',
      });

      const result = await AudioMetadata.getRemoteUpdatedAt('archive-1.zip');

      expect(getMock).toHaveBeenCalledWith('archive-1.zip');
      expect(result).toBe('2026-05-01T10:00:00.000Z');
    });

    it('returns null when metadata does not exist', async () => {
      getMock.mockResolvedValue(undefined);

      const result = await AudioMetadata.getRemoteUpdatedAt('archive-2.zip');

      expect(getMock).toHaveBeenCalledWith('archive-2.zip');
      expect(result).toBeNull();
    });
  });

  describe('markAsFetched', () => {
    it('stores archive metadata with the provided remote updated_at timestamp', async () => {
      putMock.mockResolvedValue(undefined);

      await AudioMetadata.markAsFetched('archive-3.zip', '2026-05-10T12:34:56.789Z');

      expect(putMock).toHaveBeenCalledTimes(1);
      expect(putMock).toHaveBeenCalledWith({
        archive_name: 'archive-3.zip',
        remote_updated_at: '2026-05-10T12:34:56.789Z',
      });
    });
  });
});
