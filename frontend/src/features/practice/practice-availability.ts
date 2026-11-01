import UserLesson from '@/database/models/user-lessons';
import UserItem from '@/database/models/user-items';
import config from '@/config/config';
import { loadReviewAvailabilityFromArrays } from './review-prefetch';
import { getPrefetchedNextInitialLesson } from './practice-prefetch';

export type PracticeAvailabilitySnapshot = Readonly<{
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  grammarReviewDueCount: number;
  vocabularyReviewDueCount: number;
  nextReviewAt: string | null;
  initialTrainingAvailable: boolean;
  continuingInitialLessonToday: boolean;
}>;

/** Loads the complete availability snapshot used by the practice actions on Home. */
export async function loadPracticeAvailabilitySnapshot(
  userId: string,
): Promise<PracticeAvailabilitySnapshot> {
  const [review, nextInitialLesson] = await Promise.all([
    loadReviewAvailability(userId),
    getPrefetchedNextInitialLesson(userId),
  ]);
  const nextLessonStartedToday = nextInitialLesson?.lesson
    ? await UserLesson.hasStartedToday(userId, nextInitialLesson.lesson.id)
    : false;
  return {
    grammarReviewReadyAt: review.grammarReviewReadyAt,
    vocabularyReviewReadyAt: review.vocabularyReviewReadyAt,
    grammarReviewDueCount: review.grammarReviewDueCount,
    vocabularyReviewDueCount: review.vocabularyReviewDueCount,
    nextReviewAt: review.nextReviewAt,
    initialTrainingAvailable: nextInitialLesson !== null,
    continuingInitialLessonToday: nextLessonStartedToday,
  };
}

async function loadReviewAvailability(userId: string) {
  try {
    return await loadReviewAvailabilityFromArrays(userId);
  } catch {
    return UserItem.getReadyReviewState(userId);
  }
}

export function isReviewLimitReached(dueCount: number, limitSize: number): boolean {
  return dueCount >= limitSize;
}

export function hasReachedReviewLimit(
  availability: Pick<
    PracticeAvailabilitySnapshot,
    | 'grammarReviewDueCount'
    | 'vocabularyReviewDueCount'
  >,
): boolean {
  return (
    isReviewLimitReached(
      availability.grammarReviewDueCount,
      config.practice.grammarReviewLimitSize,
    ) ||
    isReviewLimitReached(
      availability.vocabularyReviewDueCount,
      config.practice.vocabularyReviewLimitSize,
    )
  );
}
