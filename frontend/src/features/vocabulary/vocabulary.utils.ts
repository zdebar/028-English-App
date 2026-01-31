import config from '@/config/config';
import { TEXTS } from '@/config/texts.config';

/**
 * Returns a shortened date string (YYYY-MM-DD) from an ISO date string.
 * @param isoDate ISO date string
 * @returns Shortened date string or "není k dispozici" if date is undefined or null replacement date.
 */
export function shortenDate(isoDate: string | null | undefined): string {
  if (!isoDate || isoDate === config.database.nullReplacementDate) return TEXTS.notAvailable;
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
