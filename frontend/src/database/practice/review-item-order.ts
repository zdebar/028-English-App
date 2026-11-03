import config from '@/config/config';
import type { PracticeDeckItem, UserItemLocal } from '@/types/user-item.types';
import { compareCurriculumPaths } from './user-item-practice';

const NULL_DATE = config.database.nullReplacementDate;
const RESET_SORT_DATE = '0000-01-01T00:00:00.000Z';

/** Orders practice rows by their next directional review, then curriculum order. */
export function compareReviewItems(left: PracticeDeckItem, right: PracticeDeckItem): number {
  const dateComparison = getReviewItemNextAt(left).localeCompare(getReviewItemNextAt(right));
  if (dateComparison !== 0) return dateComparison;
  return compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path) || left.item_id - right.item_id;
}

export function getReviewItemNextAt(item: UserItemLocal): string {
  const nextAt = item.review_direction === 'en_to_cz'
    ? item.next_at_en_to_cz ?? item.next_at_cz_to_en
    : item.next_at_cz_to_en;
  return nextAt === NULL_DATE ? RESET_SORT_DATE : nextAt;
}
