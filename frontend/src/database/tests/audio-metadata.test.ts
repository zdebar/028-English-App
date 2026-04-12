import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  describe('isFetched', () => {
    it('returns true when metadata exists', async () => {
      getMock.mockResolvedValue({
        archive_name: 'archive-1.zip',
        fetched_at: '2026-02-28T10:00:00.000Z',
      });

      const result = await AudioMetadata.isFetched('archive-1.zip');

      expect(getMock).toHaveBeenCalledWith('archive-1.zip');
      expect(result).toBe(true);
    });

    it('returns false when metadata does not exist', async () => {
      getMock.mockResolvedValue(undefined);

      const result = await AudioMetadata.isFetched('archive-2.zip');

      expect(getMock).toHaveBeenCalledWith('archive-2.zip');
      expect(result).toBe(false);
    });
  });

  describe('markAsFetched', () => {
    it('stores archive metadata with current ISO timestamp', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T12:34:56.789Z'));
      putMock.mockResolvedValue(undefined);

      await AudioMetadata.markAsFetched('archive-3.zip');

      expect(putMock).toHaveBeenCalledTimes(1);
      expect(putMock).toHaveBeenCalledWith({
        archive_name: 'archive-3.zip',
        fetched_at: '2026-02-28T12:34:56.789Z',
      });
    });
  });
});
