import config from '@/config/config';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/local.types';

/**
 * Returns a shortened date string (YYYY-MM-DD) from an ISO date string.
 * @param isoDate ISO date string
 * @returns Shortened date string or empty string if date is undefined or null replacement date.
 */
export function shortenDate(isoDate: string | null | undefined): string {
  if (!isoDate || isoDate === config.database.nullReplacementDate) return '';
  return isoDate.split('T')[0];
}

/**
 * Utility functions for text manipulation.
 * @param {number} count
 * @returns {string}
 */
export function getMoreTextInCzech(count: number): string {
  return count <= 4 ? TEXTS.next : TEXTS.nextFivePlus;
}

export type DisplayField = 'czech' | 'english';

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
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return sortedWords.slice(0, visibleCount);
  }
  // Binary search to find the first match
  let left = 0;
  let right = sortedWords.length - 1;
  let firstMatch = -1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const value = (sortedWords[mid][displayField] || '').toLowerCase();
    if (value.startsWith(normalizedSearch)) {
      firstMatch = mid;
      right = mid - 1;
    } else if (value < normalizedSearch) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  if (firstMatch === -1) return [];
  // Collect matches starting from the first match
  const result = [];
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
