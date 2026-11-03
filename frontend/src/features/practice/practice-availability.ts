import config from '@/config/config';
import type { ReviewAvailability } from '@/database/state/data-types';

export type PracticeAvailabilitySnapshot = ReviewAvailability & Readonly<{
  initialTrainingAvailable: boolean;
  continuingInitialLessonToday: boolean;
}>;

/** Checks whether due review items meet the configured minimum deck size. */
export function isReviewLimitReached(dueCount: number, limitSize: number): boolean {
  return dueCount >= limitSize;
}

/** Checks whether either review category currently blocks starting new initial training. */
export function hasReachedReviewLimit(
  availability: Pick<PracticeAvailabilitySnapshot, 'grammarReviewDueCount' | 'vocabularyReviewDueCount'>,
): boolean {
  return (
    isReviewLimitReached(availability.grammarReviewDueCount, config.practice.grammarReviewLimitSize) ||
    isReviewLimitReached(availability.vocabularyReviewDueCount, config.practice.vocabularyReviewLimitSize)
  );
}
