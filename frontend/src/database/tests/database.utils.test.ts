import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
      nullReplacementNumber: 0,
    },
    srs: {
      intervals: [10, 20, 30],
      randomness: 0.1,
    },
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    storage: {
      from: () => ({
        download: (...args: unknown[]) => mocks.download(...args),
      }),
    },
  },
}));

import {
  getLocalDateFromUTC,
  getTodayShortDate,
} from '@/database/utils/database.utils';
import { getNextAt, resetUserItem } from '@/database/utils/user-items.utils';
import { fetchStorage } from '@/database/utils/audio-records.utils';

describe('database.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('date helpers', () => {
    it('returns today as en-CA short date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T12:00:00.000Z'));

      expect(getTodayShortDate()).toBe('2026-02-28');
    });

    it('converts UTC date string to local en-CA short date', () => {
      expect(getLocalDateFromUTC('2026-02-28T00:00:00.000Z')).toBe('2026-02-28');
    });
  });

  describe('fetchStorage', () => {
    it('downloads blob from storage using the normalized object path', async () => {
      const blob = new Blob(['ok']);
      mocks.download.mockResolvedValue({ data: blob, error: null });

      const result = await fetchStorage('bucket-a', '/file.json');

      expect(mocks.download).toHaveBeenCalledWith('file.json');
      expect(result).toBe(blob);
    });

    it('throws when storage download returns error', async () => {
      mocks.download.mockResolvedValue({ data: null, error: { message: 'not found' } });

      await expect(fetchStorage('bucket-a', 'missing.json')).rejects.toThrow(
        'Error fetching file missing.json from bucket bucket-a: not found',
      );
    });
  });

  describe('resetUserItem', () => {
    it('resets dates/progress and updates updated_at', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T08:00:00.000Z'));

      const item = {
        progress_cz_to_en: 4,
        started_at: 'x',
        next_at_cz_to_en: 'x',
        mastered_at_cz_to_en: 'x',
        updated_at: 'x',
      } as any;

      resetUserItem(item);

      expect(item.progress_cz_to_en).toBe(0);
      expect(item.started_at).toBe('x');
      expect(item.next_at_cz_to_en).toBe('1970-01-01T00:00:00.000Z');
      expect(item.mastered_at_cz_to_en).toBe('1970-01-01T00:00:00.000Z');
      expect(item.updated_at).toBe('2026-02-28T08:00:00.000Z');
    });
  });

  describe('getNextAt', () => {
    it('returns null replacement date when interval is missing', () => {
      expect(getNextAt(99)).toBe('1970-01-01T00:00:00.000Z');
    });

    it('returns randomized future ISO date from interval', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
        ((array: Uint32Array) => {
          array[0] = 2 ** 31;
          return array;
        }) as typeof globalThis.crypto.getRandomValues,
      );

      const result = getNextAt(1);

      expect(result).toBe(new Date(21000).toISOString());
    });
  });

});
