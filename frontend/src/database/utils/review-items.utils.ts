import config from '@/config/config';
import type { ReviewKind } from '@/types/practice.types';
import type { UserItemLocal } from '@/types/user-item.types';
import { getEffectiveProgress } from '@/utils/progress.utils';

const NULL_DATE = config.database.nullReplacementDate;

export function isReviewItemCandidate(item: UserItemLocal, reviewKind: ReviewKind): boolean {
  if (item.deleted_at !== NULL_DATE || item.started_at === NULL_DATE) return false;
  if (item.mastered_at_cz_to_en !== NULL_DATE) return false;
  if (item.next_at_cz_to_en === NULL_DATE && getEffectiveProgress(item) !== 0) return false;
  return reviewKind === 'vocabulary' ? item.is_vocabulary === 1 : item.is_vocabulary === 0;
}

export function isReviewItemDue(item: UserItemLocal, nowIso: string): boolean {
  if (item.next_at_cz_to_en === NULL_DATE) {
    return getEffectiveProgress(item) === 0;
  }
  return item.next_at_cz_to_en < nowIso;
}

export function isReviewItemReadyAt(item: UserItemLocal, nowIso: string): boolean {
  if (item.next_at_cz_to_en === NULL_DATE) {
    return getEffectiveProgress(item) === 0;
  }

  return (
    item.next_at_cz_to_en <= nowIso &&
    Number.isFinite(Date.parse(item.next_at_cz_to_en))
  );
}

export function isReviewItemFuture(item: UserItemLocal, nowIso: string): boolean {
  return (
    item.next_at_cz_to_en !== NULL_DATE &&
    item.next_at_cz_to_en > nowIso &&
    Number.isFinite(Date.parse(item.next_at_cz_to_en))
  );
}
