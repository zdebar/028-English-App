import type { UserItemLocal } from '@/types/user-item.types';
import config from '@/config/config';

const NULL_DATE = config.database.nullReplacementDate;

/**
 * Calculates the next SRS review timestamp for a progress level.
 *
 * @param progress Progress index used to read the configured SRS intervals.
 * @returns Future ISO timestamp with configured randomness, or the null replacement date when
 * no interval exists for the progress value.
 */
export function getNextAt(progress: number): string {
  const interval = config.srs.intervals[progress];
  if (interval == null) return NULL_DATE;

  const randomFactor = 1 + config.srs.randomness * (getRandomUnitInterval() * 2 - 1);
  const randomizedInterval = Math.round(interval * randomFactor);
  const nextDate = new Date(Date.now() + randomizedInterval * 1000);
  return nextDate.toISOString();
}

function getRandomUnitInterval(): number {
  const randomValues = new Uint32Array(1);
  globalThis.crypto.getRandomValues(randomValues);
  return randomValues[0] / 2 ** 32;
}

/**
 * Resets learning progress while preserving the historical start timestamp.
 *
 * @param item Local user item object to reset in place.
 */
export function resetUserItem(item: UserItemLocal, dateTime: string = new Date().toISOString()): void {
  item.next_at_cz_to_en = NULL_DATE;
  item.mastered_at_cz_to_en = NULL_DATE;
  item.updated_at = dateTime;
  item.progress_cz_to_en = 0;
}

