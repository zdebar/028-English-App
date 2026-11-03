import config from '@/config/config';
import type { UserItemLocal } from '@/types/user-item.types';

const NULL_DATE = config.database.nullReplacementDate;

type InitiatedItem = Pick<UserItemLocal, 'started_at' | 'mastered_at_cz_to_en'>;

/** Returns whether an item has been initiated, including initial-training skips. */
export function isInitiated(item: InitiatedItem): boolean {
  return (
    (item.started_at ?? NULL_DATE) !== NULL_DATE ||
    (item.mastered_at_cz_to_en ?? NULL_DATE) !== NULL_DATE
  );
}
