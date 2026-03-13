import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  savePracticeDeck: vi.fn(),
  infoHandler: vi.fn(),
  errorHandler: vi.fn(),
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

vi.mock('@/features/logging/info-handler', () => ({
  infoHandler: (...args: unknown[]) => mocks.infoHandler(...args),
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    savePracticeDeck: (...args: unknown[]) => mocks.savePracticeDeck(...args),
  },
}));

import {
  getLocalDateFromUTC,
  getTodayShortDate,
  restoreUnsavedFromLocalStorage,
} from '@/database/utils/database.utils';
import {
  convertLocalToSQL,
  convertSQLToLocal,
  getNextAt,
  resetUserItem,
} from '@/database/utils/user-items.utils';
import { fetchStorage } from '@/database/utils/audio-records.utils';
import {
  triggerLevelsUpdatedEvent,
  triggerNamedEvent,
} from '@/features/user-stats/dashboard.utils';

describe('database.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('convertLocalToSQL', () => {
    it('converts null-replacement dates to null', () => {
      const result = convertLocalToSQL({
        user_id: 'u1',
        item_id: 10,
        progress: 2,
        started_at: '1970-01-01T00:00:00.000Z',
        updated_at: '2026-02-28T10:00:00.000Z',
        next_at: '1970-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          user_id: 'u1',
          item_id: 10,
          progress: 2,
          started_at: null,
          updated_at: '2026-02-28T10:00:00.000Z',
          next_at: null,
          mastered_at: null,
        }),
      );
    });
  });

  describe('convertSQLToLocal', () => {
    it('fills null/undefined sortable/date fields with local null-replacement values', () => {
      const result = convertSQLToLocal({
        user_id: 'u1',
        item_id: 1,
        progress: 0,
        updated_at: '2026-02-28T10:00:00.000Z',
        grammar_id: null as unknown as number,
        started_at: null as unknown as string,
        next_at: null as unknown as string,
        mastered_at: null as unknown as string,
      } as any);

      expect(result.grammar_id).toBe(0);
      expect(result.started_at).toBe('1970-01-01T00:00:00.000Z');
      expect(result.next_at).toBe('1970-01-01T00:00:00.000Z');
      expect(result.mastered_at).toBe('1970-01-01T00:00:00.000Z');
    });
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
    it('downloads blob from storage using cache-busted path', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(123456);
      const blob = new Blob(['ok']);
      mocks.download.mockResolvedValue({ data: blob, error: null });

      const result = await fetchStorage('bucket-a', '/file.json');

      expect(mocks.download).toHaveBeenCalledWith('file.json?t=123456');
      expect(result).toBe(blob);
    });

    it('throws when storage download returns error', async () => {
      mocks.download.mockResolvedValue({ data: null, error: { message: 'not found' } });

      await expect(fetchStorage('bucket-a', 'missing.json')).rejects.toThrow(
        'Error fetching file missing.json from bucket bucket-a: not found',
      );
    });
  });

  describe('event helpers', () => {
    it('dispatches named event with userId detail', () => {
      const spy = vi.spyOn(window, 'dispatchEvent');

      triggerNamedEvent('evt', 'u1');

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('evt');
      expect(event.detail).toEqual({ userId: 'u1' });
    });

    it('triggers levelsUpdated event shortcut', () => {
      const spy = vi.spyOn(window, 'dispatchEvent');

      triggerLevelsUpdatedEvent('u1');

      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('levelsUpdated');
      expect(event.detail).toEqual({ userId: 'u1' });
    });
  });

  describe('resetUserItem', () => {
    it('resets dates/progress and updates updated_at', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T08:00:00.000Z'));

      const item = {
        progress: 4,
        started_at: 'x',
        next_at: 'x',
        mastered_at: 'x',
        updated_at: 'x',
      } as any;

      resetUserItem(item);

      expect(item.progress).toBe(0);
      expect(item.started_at).toBe('1970-01-01T00:00:00.000Z');
      expect(item.next_at).toBe('1970-01-01T00:00:00.000Z');
      expect(item.mastered_at).toBe('1970-01-01T00:00:00.000Z');
      expect(item.updated_at).toBe('2026-02-28T08:00:00.000Z');
    });
  });

  describe('getNextAt', () => {
    it('returns null replacement date when interval is missing', () => {
      expect(getNextAt(99)).toBe('1970-01-01T00:00:00.000Z');
    });

    it('returns randomized future ISO date from interval', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = getNextAt(1);

      expect(result).toBe(new Date(21000).toISOString());
    });
  });

  describe('restoreUnsavedFromLocalStorage', () => {
    it('restores saved progress, removes key, and logs info', async () => {
      localStorage.setItem(
        'practiceDeckProgress_u1',
        JSON.stringify({
          dateTime: '2026-03-04T10:00:00.000Z',
          progress: [{ item_id: 1, progress: 2 }],
        }),
      );

      await restoreUnsavedFromLocalStorage('u1');

      expect(mocks.savePracticeDeck).toHaveBeenCalledWith(
        'u1',
        [{ item_id: 1, progress: 2 }],
        '2026-03-04T10:00:00.000Z',
      );
      expect(localStorage.getItem('practiceDeckProgress_u1')).toBeNull();
      expect(mocks.infoHandler).toHaveBeenCalled();
    });

    it('handles parse error by logging and removing invalid key', async () => {
      localStorage.setItem('practiceDeckProgress_u1', '{bad json');

      await restoreUnsavedFromLocalStorage('u1');

      expect(mocks.errorHandler).toHaveBeenCalledWith(
        'Error parsing practice deck progress from localStorage',
        expect.anything(),
      );
      expect(localStorage.getItem('practiceDeckProgress_u1')).toBeNull();
    });
  });
});
