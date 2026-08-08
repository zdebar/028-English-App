import config from '@/config/config';
import type { UserItemLocal } from '@/types/user-item.types';
import { assertPositiveInteger } from '@/utils/assertions.utils';

const VOCABULARY_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Returns whether a stored vocabulary date represents an actual timestamp. */
export function hasVocabularyDate(isoDate: string | null | undefined): isoDate is string {
  return Boolean(isoDate && isoDate !== config.database.nullReplacementDate);
}

/**
 * Formats a vocabulary timestamp in Czech using the device's current timezone.
 * Returns an empty string when the value is missing, is the database null sentinel, or is invalid.
 */
export function formatVocabularyDateTime(isoDate: string | null | undefined): string {
  if (!hasVocabularyDate(isoDate)) return '';

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  return VOCABULARY_DATE_TIME_FORMATTER.format(date);
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
    throw new TypeError('sortedWords must be an array.');
  }
  assertPositiveInteger(visibleCount, 'visibleCount');

  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return sortedWords.slice(0, visibleCount);
  }

  const result: UserItemLocal[] = [];
  for (const word of sortedWords) {
    const value = (word[displayField] || '').toLowerCase();
    if (!value.startsWith(normalizedSearch)) continue;

    result.push(word);
    if (result.length === visibleCount) break;
  }

  return result;
}
