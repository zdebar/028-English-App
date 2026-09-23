/**
 * Returns today's local calendar date.
 *
 * @returns Date string formatted as YYYY-MM-DD using the runtime locale date in en-CA format.
 */
export function getTodayShortDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-CA');
}

/**
 * Converts a date string to the local calendar date used by app counters.
 *
 * @param date Date string accepted by Date; normally an ISO UTC timestamp from storage or sync.
 * @returns Local YYYY-MM-DD date string in en-CA format.
 */
export function getLocalDateFromUTC(date: string): string {
  const localDate = new Date(date);
  return localDate.toLocaleDateString('en-CA');
}


