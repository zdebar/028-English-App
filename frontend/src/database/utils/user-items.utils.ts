import type { UserItemLocal } from '@/types/user-item.types';
import config from '@/config/config';

const NULL_DATE = config.database.nullReplacementDate;

/**
 * Calculates the next SRS review timestamp for a progress level.
 *
 * @param progress Progress index used to read config.srs.intervals.
 * @returns Future ISO timestamp with configured randomness, or the null replacement date when
 * no interval exists for the progress value.
 */
export function getNextAt(progress: number): string {
  const interval = config.srs.intervals[progress];
  if (interval == null) return NULL_DATE;

  const randomFactor = 1 + config.srs.randomness * (Math.random() * 2 - 1);
  const randomizedInterval = Math.round(interval * randomFactor);
  const nextDate = new Date(Date.now() + randomizedInterval * 1000);
  return nextDate.toISOString();
}

/**
 * Mutates a user item back to its unstarted local state.
 *
 * @param item Local user item object to reset in place.
 */
export function resetUserItem(item: UserItemLocal): void {
  item.started_at = NULL_DATE;
  item.next_at = NULL_DATE;
  item.mastered_at = NULL_DATE;
  item.updated_at = new Date().toISOString();
  item.progress = 0;
}

