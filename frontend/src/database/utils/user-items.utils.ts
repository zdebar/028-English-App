import type { PracticeDirection, UserItemLocal } from '@/types/user-item.types';
import config from '@/config/config';

const NULL_DATE = config.database.nullReplacementDate;

/**
 * Calculates the next SRS review timestamp for a progress level.
 *
 * @param progress Progress index used to read the direction's configured intervals.
 * @param direction Practice direction whose independent interval array is used.
 * @returns Future ISO timestamp with configured randomness, or the null replacement date when
 * no interval exists for the progress value.
 */
export function getNextAt(progress: number, direction: PracticeDirection): string {
  const interval = config.srs.intervals[direction][progress];
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
 * Mutates a user item back to its unstarted local state.
 *
 * @param item Local user item object to reset in place.
 */
export function resetUserItem(item: UserItemLocal): void {
  item.started_at = NULL_DATE;
  item.next_at_cz_to_en = NULL_DATE;
  item.next_at_en_to_cz = NULL_DATE;
  item.mastered_at_cz_to_en = NULL_DATE;
  item.mastered_at_en_to_cz = NULL_DATE;
  item.updated_at = new Date().toISOString();
  item.progress_cz_to_en = 0;
  item.progress_en_to_cz = 0;
}

