import config from '@/config/config';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import type { CurriculumSortPath, PracticeOutcome, UserItemLocal } from '@/types/user-item.types';
import { getNextAt } from './user-items.utils';
import {
  isReviewItemCandidate,
  isReviewItemFuture,
  isReviewItemReadyAt,
} from './review-items.utils';

const NULL_DATE = config.database.nullReplacementDate;

export function isReviewDirectionEnabled(item: UserItemLocal, direction: ReviewDirection): boolean {
  if (direction === 'cz_to_en') return item.is_cz_to_en_enabled;
  return item.is_en_to_cz_enabled;
}

export function getEarlierDate(left: string | null, right: string | null): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left < right ? left : right;
}

export function getPracticeIndex(direction: ReviewDirection): string {
  if (direction === 'en_to_cz') {
    return '[user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]';
  }
  return '[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]';
}

export function getItemsForBothDirections(
  items: UserItemLocal[],
  reviewKind: ReviewKind,
): UserItemLocal[] {
  const matchingItems = items.filter((item) => isReviewKind(item, reviewKind));
  return matchingItems
    .flatMap((item) => [
      { ...item, review_direction: 'cz_to_en' as const },
      { ...item, review_direction: 'en_to_cz' as const },
    ])
    .filter((item) => isReviewItemCandidate(item, reviewKind, item.review_direction));
}

export function getDueCount(items: UserItemLocal[], nowIso: string): number {
  return items.filter((item) => isReviewItemReadyAt(item, nowIso, item.review_direction)).length;
}

export function getReadyAt(items: UserItemLocal[], deckSize: number, nowIso: string): string | null {
  const dueItems = items.filter((item) => isReviewItemReadyAt(item, nowIso, item.review_direction));
  if (dueItems.length >= deckSize) return nowIso;

  const futureItems = items
    .filter((item) => isReviewItemFuture(item, nowIso, item.review_direction))
    .sort((left, right) =>
      (getDirectionalNextAt(left) ?? '').localeCompare(getDirectionalNextAt(right) ?? ''),
    );
  return getDirectionalNextAt(futureItems[deckSize - dueItems.length - 1] ?? null);
}

export function getNextReviewAtForItems(items: UserItemLocal[], nowIso: string): string | null {
  const nextItem = items
    .filter((item) => isReviewItemFuture(item, nowIso, item.review_direction))
    .sort((left, right) =>
      (getDirectionalNextAt(left) ?? '').localeCompare(getDirectionalNextAt(right) ?? ''),
    )[0];
  return getDirectionalNextAt(nextItem ?? null);
}

export function isInitialTrainingSkipped(
  item: Pick<UserItemLocal, 'started_at' | 'mastered_at_cz_to_en'>,
): boolean {
  return item.started_at === NULL_DATE && (item.mastered_at_cz_to_en ?? NULL_DATE) !== NULL_DATE;
}

export function applyPracticeProgress(
  item: UserItemLocal,
  outcome: PracticeOutcome,
  dateTime: string,
  options: Readonly<{ initialTraining?: boolean; direction?: ReviewDirection }> = {},
): UserItemLocal {
  if (options.initialTraining === true) return applyInitialTrainingProgress(item, outcome, dateTime);
  return applyReviewProgress(item, outcome, dateTime, options.direction ?? 'cz_to_en');
}

export function compareCurriculumPaths(left: CurriculumSortPath, right: CurriculumSortPath): number {
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

function getDirectionalNextAt(item: UserItemLocal | null): string | null {
  if (!item) return null;
  if (item.review_direction === 'en_to_cz') return item.next_at_en_to_cz;
  return item.next_at_cz_to_en;
}

function applyInitialTrainingProgress(
  item: UserItemLocal,
  outcome: PracticeOutcome,
  dateTime: string,
): UserItemLocal {
  const changes: Partial<UserItemLocal> = {
    ...item,
    started_at: getStartedAt(item, dateTime),
    updated_at: dateTime,
  };

  if (outcome === 'skip') {
    setMastered(changes, dateTime);
  } else {
    initializeProgress(changes);
  }

  changes.progress_en_to_cz = changes.progress_cz_to_en;
  changes.next_at_en_to_cz = changes.next_at_cz_to_en;
  changes.mastered_at_en_to_cz = changes.mastered_at_cz_to_en;
  return { ...item, ...changes };
}

function applyReviewProgress(
  item: UserItemLocal,
  outcome: PracticeOutcome,
  dateTime: string,
  direction: ReviewDirection,
): UserItemLocal {
  const currentProgress = direction === 'cz_to_en' ? item.progress_cz_to_en : item.progress_en_to_cz;
  const changes: Partial<UserItemLocal> = {
    ...item,
    started_at: getStartedAt(item, dateTime),
    updated_at: dateTime,
  };

  if (outcome === 'skip') {
    setMastered(changes, dateTime, currentProgress, direction);
  } else {
    const progressDelta = getReviewProgressDelta(outcome);
    setProgress(changes, item, Math.max(0, currentProgress + progressDelta), dateTime, direction);
  }
  return { ...item, ...changes };
}

function getReviewProgressDelta(outcome: PracticeOutcome): number {
  if (outcome === 'repeat' || outcome === 'incorrect') return config.srs.ratingProgressDelta.repeat;
  if (outcome === 'hard') return config.srs.ratingProgressDelta.hard;
  if (outcome === 'easy') return config.srs.ratingProgressDelta.easy;
  return config.srs.ratingProgressDelta.good;
}

function getStartedAt(item: UserItemLocal, dateTime: string): string {
  return item.started_at === NULL_DATE ? dateTime : item.started_at;
}

function setProgress(
  target: Partial<UserItemLocal>,
  original: UserItemLocal,
  progress: number,
  dateTime: string,
  direction: ReviewDirection,
): void {
  const currentMasteredAt = direction === 'cz_to_en'
    ? original.mastered_at_cz_to_en
    : original.mastered_at_en_to_cz;
  const masteredAt = resolveMasteredAt(progress, currentMasteredAt, dateTime);

  if (direction === 'cz_to_en') {
    target.progress_cz_to_en = progress;
    target.next_at_cz_to_en = getNextAtForMastery(getNextAt(progress), masteredAt);
    target.mastered_at_cz_to_en = masteredAt;
    return;
  }
  target.progress_en_to_cz = progress;
  target.next_at_en_to_cz = getNextAtForMastery(getNextAt(progress), masteredAt);
  target.mastered_at_en_to_cz = masteredAt;
}

function initializeProgress(target: Partial<UserItemLocal>): void {
  target.progress_cz_to_en = 0;
  target.next_at_cz_to_en = getNextAt(0);
  target.mastered_at_cz_to_en = NULL_DATE;
}

function setMastered(
  target: Partial<UserItemLocal>,
  dateTime: string,
  progress = 0,
  direction: ReviewDirection = 'cz_to_en',
): void {
  if (direction === 'cz_to_en') {
    target.progress_cz_to_en = progress;
    target.next_at_cz_to_en = NULL_DATE;
    target.mastered_at_cz_to_en = dateTime;
    return;
  }
  target.progress_en_to_cz = progress;
  target.next_at_en_to_cz = NULL_DATE;
  target.mastered_at_en_to_cz = dateTime;
}

function getNextAtForMastery(nextAt: string, masteredAt: string): string {
  return masteredAt !== NULL_DATE ? NULL_DATE : nextAt;
}

function resolveMasteredAt(progress: number, currentMasteredAt: string, dateTime: string): string {
  if (progress < config.srs.intervals.length) return currentMasteredAt;
  if (currentMasteredAt !== NULL_DATE) return currentMasteredAt;
  return dateTime;
}

function isReviewKind(
  item: Pick<UserItemLocal, 'is_vocabulary'>,
  reviewKind: ReviewKind,
): boolean {
  return reviewKind === 'vocabulary' ? item.is_vocabulary === 1 : item.is_vocabulary === 0;
}
