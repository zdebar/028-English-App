import config from '@/config/config';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import type { UserItemLocal } from '@/types/user-item.types';

const NULL_DATE = config.database.nullReplacementDate;

export function isReviewItemCandidate(item: UserItemLocal, reviewKind: ReviewKind, direction: ReviewDirection = 'cz_to_en'): boolean {
  return isActiveItem(item) &&
    isDirectionEnabled(item, direction) &&
    isDirectionUnmastered(item, direction) &&
    isProgressSchedulable(item, direction) &&
    matchesReviewKind(item, reviewKind);
}

function isActiveItem(item: UserItemLocal): boolean {
  return item.deleted_at === NULL_DATE && item.started_at !== NULL_DATE;
}

function isDirectionEnabled(item: UserItemLocal, direction: ReviewDirection): boolean {
  if (direction === 'cz_to_en') return item.is_cz_to_en_enabled !== false;
  return item.is_en_to_cz_enabled !== false;
}

function isDirectionUnmastered(item: UserItemLocal, direction: ReviewDirection): boolean {
  if (direction === 'cz_to_en') return item.mastered_at_cz_to_en === NULL_DATE;
  return item.mastered_at_en_to_cz === NULL_DATE;
}

function isProgressSchedulable(item: UserItemLocal, direction: ReviewDirection): boolean {
  if (direction === 'cz_to_en') {
    return item.next_at_cz_to_en !== NULL_DATE || item.progress_cz_to_en === 0;
  }
  return item.next_at_en_to_cz !== NULL_DATE || item.progress_en_to_cz === 0;
}

function matchesReviewKind(item: UserItemLocal, reviewKind: ReviewKind): boolean {
  if (reviewKind === 'vocabulary') return item.is_vocabulary === 1;
  return item.is_vocabulary === 0;
}

export function isReviewItemDue(item: UserItemLocal, nowIso: string, direction: ReviewDirection = 'cz_to_en'): boolean {
  const nextAt = direction === 'cz_to_en' ? item.next_at_cz_to_en : item.next_at_en_to_cz;
  const progress = direction === 'cz_to_en' ? item.progress_cz_to_en : item.progress_en_to_cz;
  if (nextAt === NULL_DATE) {
    return progress === 0;
  }
  return nextAt < nowIso;
}

export function isReviewItemReadyAt(item: UserItemLocal, nowIso: string, direction: ReviewDirection = 'cz_to_en'): boolean {
  const nextAt = direction === 'cz_to_en' ? item.next_at_cz_to_en : item.next_at_en_to_cz;
  const progress = direction === 'cz_to_en' ? item.progress_cz_to_en : item.progress_en_to_cz;
  if (nextAt === NULL_DATE) {
    return progress === 0;
  }

  return (
    nextAt <= nowIso &&
    Number.isFinite(Date.parse(nextAt))
  );
}

export function isReviewItemFuture(item: UserItemLocal, nowIso: string, direction: ReviewDirection = 'cz_to_en'): boolean {
  const nextAt = direction === 'cz_to_en' ? item.next_at_cz_to_en : item.next_at_en_to_cz;
  return (
    nextAt !== NULL_DATE &&
    nextAt > nowIso &&
    Number.isFinite(Date.parse(nextAt))
  );
}
