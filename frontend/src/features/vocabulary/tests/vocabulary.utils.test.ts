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
    more: 'další',
  },
}));

import {
  compareCzechStrings,
  filterSortedWords,
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

  it('filterSortedWords handles Czech diacritics in search term', () => {
    const words = [
      { czech: 'čaj', english: 'tea' },
      { czech: 'cena', english: 'price' },
      { czech: 'čepice', english: 'cap' },
      { czech: 'dům', english: 'house' },
      { czech: 'dopis', english: 'letter' },
    ] as any;

    const sortedByCzech = [...words].sort((a, b) => a.czech.localeCompare(b.czech, 'cs'));

    const exactDiacritics = filterSortedWords(sortedByCzech, 'č', 'czech', 10);
    expect(exactDiacritics.map((x: any) => x.czech)).toEqual(['čaj', 'čepice']);

    const withoutDiacritics = filterSortedWords(sortedByCzech, 'c', 'czech', 10);
    expect(withoutDiacritics.map((x: any) => x.czech)).toEqual(['cena']);

    const dWords = filterSortedWords(sortedByCzech, 'd', 'czech', 10);
    expect(dWords.map((x: any) => x.czech)).toEqual(['dopis', 'dům']);
  });

  it('Czech locale sorting works for the whole word, not just first letter', () => {
    const words = ['ca', 'cb', 'čaj', 'čáp', 'da', 'ďas'];
    const sorted = [...words].sort(compareCzechStrings);

    expect(sorted).toEqual(['ca', 'cb', 'čaj', 'čáp', 'da', 'ďas']);
  });

  it('sorts diacritics after base letters for Czech words', () => {
    const words = ['ěra', 'eva', 'íra', 'ivan', 'čaj', 'citron', 'ďábel', 'darek'];
    const sorted = [...words].sort(compareCzechStrings);

    expect(sorted).toEqual(['citron', 'čaj', 'darek', 'ďábel', 'eva', 'ěra', 'ivan', 'íra']);
  });
});
