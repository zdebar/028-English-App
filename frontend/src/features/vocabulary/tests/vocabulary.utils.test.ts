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
  filterSortedWords,
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

  it('filterSortedWords filters by prefix from pre-sorted arrays and respects visibleCount', () => {
    const words = [
      { czech: 'Banán', english: 'Banana' },
      { czech: 'auto', english: 'Car' },
      { czech: 'Ahoj', english: 'Hello' },
    ] as any;

    const sortedByCzech = [...words].sort((a, b) => a.czech.localeCompare(b.czech));
    const czechResult = filterSortedWords(sortedByCzech, 'a', 'czech', 10);
    expect(czechResult.map((x: any) => x.czech)).toEqual(['Ahoj', 'auto']);

    const sortedByEnglish = [...words].sort((a, b) => a.english.localeCompare(b.english));
    const englishResult = filterSortedWords(sortedByEnglish, 'b', 'english', 10);
    expect(englishResult.map((x: any) => x.english)).toEqual(['Banana']);

    const limitedResult = filterSortedWords(sortedByCzech, 'a', 'czech', 1);
    expect(limitedResult).toHaveLength(1);
  });
});
