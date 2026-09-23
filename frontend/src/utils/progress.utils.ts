import config from '@/config/config';
import type { UserItemLocal } from '@/types/user-item.types';

const NULL_DATE = config.database.nullReplacementDate;

type EffectiveProgressItem = Pick<UserItemLocal, 'mastered_at_cz_to_en' | 'progress_cz_to_en'>;
type InitiatedItem = Pick<UserItemLocal, 'started_at' | 'mastered_at_cz_to_en'>;

export function getSrsLength(): number {
  return config.srs.intervals.length;
}

export function isMastered(item: Pick<UserItemLocal, 'mastered_at_cz_to_en'>): boolean {
  return (item.mastered_at_cz_to_en ?? NULL_DATE) !== NULL_DATE;
}

/** Returns whether an item has been initiated, including initial-training skips. */
export function isInitiated(item: InitiatedItem): boolean {
  return (
    (item.started_at ?? NULL_DATE) !== NULL_DATE ||
    (item.mastered_at_cz_to_en ?? NULL_DATE) !== NULL_DATE
  );
}

export function getEffectiveProgress(item: EffectiveProgressItem): number {
  const maxProgress = getSrsLength();
  if (isMastered(item)) return maxProgress;

  const rawProgress = item.progress_cz_to_en ?? 0;
  return Math.min(Math.max(rawProgress, 0), maxProgress);
}
