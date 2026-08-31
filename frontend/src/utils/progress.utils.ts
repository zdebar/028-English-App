import config from '@/config/config';
import type { PracticeDirection, UserItemLocal } from '@/types/user-item.types';

const NULL_DATE = config.database.nullReplacementDate;

export const PRACTICE_DIRECTIONS: readonly PracticeDirection[] = ['czToEn', 'enToCz'];

export function getSrsLength(direction: PracticeDirection): number {
  return config.srs.intervals[direction].length;
}

export function isDirectionMastered(
  item: Pick<UserItemLocal, 'mastered_at_cz_to_en' | 'mastered_at_en_to_cz'>,
  direction: PracticeDirection,
): boolean {
  return getDirectionMasteredAt(item, direction) !== NULL_DATE;
}

export function getEffectiveProgress(
  item: Pick<
    UserItemLocal,
    'progress_cz_to_en' | 'progress_en_to_cz' | 'mastered_at_cz_to_en' | 'mastered_at_en_to_cz'
  >,
  direction: PracticeDirection,
): number {
  const maxProgress = getSrsLength(direction);
  if (isDirectionMastered(item, direction)) return maxProgress;

  const rawProgress = getDirectionProgress(item, direction);
  return Math.min(Math.max(rawProgress, 0), maxProgress);
}

export function getItemEffectiveProgress(
  item: Pick<
    UserItemLocal,
    'progress_cz_to_en' | 'progress_en_to_cz' | 'mastered_at_cz_to_en' | 'mastered_at_en_to_cz'
  >,
): number {
  return PRACTICE_DIRECTIONS.reduce(
    (total, direction) => total + getEffectiveProgress(item, direction),
    0,
  );
}

export function getItemMaximumProgress(): number {
  return PRACTICE_DIRECTIONS.reduce((total, direction) => total + getSrsLength(direction), 0);
}

export function getProgressChange(
  before: Pick<
    UserItemLocal,
    'progress_cz_to_en' | 'progress_en_to_cz' | 'mastered_at_cz_to_en' | 'mastered_at_en_to_cz'
  >,
  after: Pick<
    UserItemLocal,
    'progress_cz_to_en' | 'progress_en_to_cz' | 'mastered_at_cz_to_en' | 'mastered_at_en_to_cz'
  >,
  direction: PracticeDirection,
): number {
  return getEffectiveProgress(after, direction) - getEffectiveProgress(before, direction);
}

function getDirectionProgress(
  item: Pick<UserItemLocal, 'progress_cz_to_en' | 'progress_en_to_cz'>,
  direction: PracticeDirection,
): number {
  return direction === 'czToEn' ? (item.progress_cz_to_en ?? 0) : (item.progress_en_to_cz ?? 0);
}

function getDirectionMasteredAt(
  item: Pick<UserItemLocal, 'mastered_at_cz_to_en' | 'mastered_at_en_to_cz'>,
  direction: PracticeDirection,
): string {
  return direction === 'czToEn'
    ? (item.mastered_at_cz_to_en ?? NULL_DATE)
    : (item.mastered_at_en_to_cz ?? NULL_DATE);
}
