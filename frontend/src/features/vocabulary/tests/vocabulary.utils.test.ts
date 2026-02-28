import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
    },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    next: 'další',
    nextFivePlus: 'dalších',
  },
}));

import {
  filterAndSortWords,
  getMoreTextInCzech,
  shortenDate,
} from '@/features/vocabulary/vocabulary.utils';

describe('vocabulary.utils', () => {
  it('shortenDate returns empty for null/undefined/null-replacement date', () => {
    expect(shortenDate(undefined)).toBe('');
    expect(shortenDate(null)).toBe('');
    expect(shortenDate('1970-01-01T00:00:00.000Z')).toBe('');
  });

  it('shortenDate returns YYYY-MM-DD for ISO date', () => {
    expect(shortenDate('2026-02-28T14:20:00.000Z')).toBe('2026-02-28');
  });

  it('getMoreTextInCzech chooses by count threshold', () => {
    expect(getMoreTextInCzech(1)).toBe('další');
    expect(getMoreTextInCzech(4)).toBe('další');
    expect(getMoreTextInCzech(5)).toBe('dalších');
  });

  it('filterAndSortWords filters by prefix and sorts by selected field', () => {
    const words = [
      { czech: 'Banán', english: 'Banana' },
      { czech: 'auto', english: 'Car' },
      { czech: 'Ahoj', english: 'Hello' },
    ] as any;

    const czechResult = filterAndSortWords(words, 'a', 'czech');
    expect(czechResult.map((x: any) => x.czech)).toEqual(['Ahoj', 'auto']);

    const englishResult = filterAndSortWords(words, 'b', 'english');
    expect(englishResult.map((x: any) => x.english)).toEqual(['Banana']);
  });
});
