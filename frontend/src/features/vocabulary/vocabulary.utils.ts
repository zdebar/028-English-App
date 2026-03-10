import config from '@/config/config';
import type { UserItemLocal } from '@/types/local.types';
import { assertPositiveInteger } from '@/utils/assertions.utils';

/**
 * Returns a shortened date string (YYYY-MM-DD) from an ISO date string.
 * @param isoDate ISO date string
 * @returns Shortened date string or empty string if date is undefined or null replacement date.
 */
export function shortenDate(isoDate: string | null | undefined): string {
  if (!isoDate || isoDate === config.database.nullReplacementDate) return '';
  return isoDate.split('T')[0];
}

export type DisplayField = 'czech' | 'english';

const CZECH_SORT_ORDER = [
  'a',
  'á',
  'b',
  'c',
  'č',
  'd',
  'ď',
  'e',
  'é',
  'ě',
  'f',
  'g',
  'h',
  'ch',
  'i',
  'í',
  'j',
  'k',
  'l',
  'm',
  'n',
  'ň',
  'o',
  'ó',
  'p',
  'q',
  'r',
  'ř',
  's',
  'š',
  't',
  'ť',
  'u',
  'ú',
  'ů',
  'v',
  'w',
  'x',
  'y',
  'ý',
  'z',
  'ž',
] as const;

const CZECH_SORT_INDEX = new Map<string, number>(
  CZECH_SORT_ORDER.map((letter, index) => [letter, index]),
);

function tokenizeCzech(value: string): string[] {
  const normalizedValue = value.toLowerCase();
  const tokens: string[] = [];

  for (let i = 0; i < normalizedValue.length; i++) {
    const current = normalizedValue[i];
    const next = normalizedValue[i + 1];
    if (current === 'c' && next === 'h') {
      tokens.push('ch');
      i++;
      continue;
    }

    tokens.push(current);
  }

  return tokens;
}

function getCzechTokenWeight(token: string): number {
  return CZECH_SORT_INDEX.get(token) ?? Number.MAX_SAFE_INTEGER;
}

export function compareCzechStrings(leftValue: string, rightValue: string): number {
  const leftTokens = tokenizeCzech(leftValue);
  const rightTokens = tokenizeCzech(rightValue);
  const limit = Math.min(leftTokens.length, rightTokens.length);

  for (let i = 0; i < limit; i++) {
    const leftToken = leftTokens[i];
    const rightToken = rightTokens[i];
    const leftWeight = getCzechTokenWeight(leftToken);
    const rightWeight = getCzechTokenWeight(rightToken);

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    if (leftToken !== rightToken) {
      return leftToken.localeCompare(rightToken, 'cs', { sensitivity: 'variant' });
    }
  }

  return leftTokens.length - rightTokens.length;
}

/**
 * Filters the sorted words based on the search term and display field, returning only the visible count.
 * @param sortedWords - The array of words sorted by the display field.
 * @param searchTerm - The search term to filter the words.
 * @param displayField - The field to display (czech or english).
 * @param visibleCount - The maximum number of items to return.
 * @returns An array of filtered words based on the search term and display field.
 */
export function filterSortedWords(
  sortedWords: UserItemLocal[],
  searchTerm: string,
  displayField: DisplayField,
  visibleCount: number,
): UserItemLocal[] {
  if (!Array.isArray(sortedWords)) {
    throw new Error('sortedWords must be an array.');
  }
  assertPositiveInteger(visibleCount, 'visibleCount');

  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return sortedWords.slice(0, visibleCount);
  }

  // Binary search lower bound: first item that is not smaller than search term.
  let left = 0;
  let right = sortedWords.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const value = (sortedWords[mid][displayField] || '').toLowerCase();
    if (compareCzechStrings(value, normalizedSearch) < 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  const firstMatch = left;
  const result: UserItemLocal[] = [];
  for (let i = firstMatch; i < sortedWords.length && result.length < visibleCount; i++) {
    const value = (sortedWords[i][displayField] || '').toLowerCase();
    if (value.startsWith(normalizedSearch)) {
      result.push(sortedWords[i]);
    } else {
      break;
    }
  }

  return result;
}
