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
  if (count <= 4) return TEXTS.next;
  return TEXTS.nextFivePlus;
}

export type DisplayField = 'czech' | 'english';

/**
 * Filters and sorts an array of words based on a search term and display field.
 *
 * @param words - The array of user items to filter and sort
 * @param searchTerm - The search term to filter words by (case-insensitive, prefix matching)
 * @param displayField - The field name to use for filtering and sorting
 * @returns A filtered and sorted array of user items that match the search term
 *
 * @remarks
 * - Search is case-insensitive and matches items that start with the search term
 * - If the search term is empty, all items are included
 * - Results are sorted alphabetically by the display field (case-insensitive)
 * - Null or undefined field values are treated as empty strings
 */
export function filterAndSortWords(
  words: UserItemLocal[],
  searchTerm: string,
  displayField: DisplayField,
): UserItemLocal[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return words
    .filter((item) => {
      const value = (item[displayField] ?? '').toLowerCase();
      return normalizedSearch === '' || value.startsWith(normalizedSearch);
    })
    .sort((a, b) =>
      (a[displayField] ?? '').localeCompare(b[displayField] ?? '', undefined, {
        sensitivity: 'base',
      }),
    );
}
