import UserLesson from '@/database/models/user-lessons';
import { hasReachedReviewLimit } from './practice-availability';
import { loadReviewAvailabilityFromArrays } from './review-prefetch';
import {
  getPrefetchedNextInitialLesson,
  type PreparedInitialLesson,
} from './practice-prefetch';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';
import { reportError } from '@/features/logging/logging-handler';
import { toError } from '@/utils/error.utils';

export type InitialTrainingData = PreparedInitialLesson;

export async function loadInitialTrainingData(userId: string): Promise<InitialTrainingData> {
  const prepared = await getPrefetchedNextInitialLesson(userId);
  if (!prepared?.lesson) return emptyInitialTrainingData();

  const continuingLesson = await UserLesson.hasStartedToday(userId, prepared.lesson.id);
  if (!continuingLesson && await shouldBlockInitialTraining(userId)) {
    return emptyInitialTrainingData();
  }
  return prepared;
}

async function shouldBlockInitialTraining(userId: string): Promise<boolean> {
  const cachedAvailability = usePracticeAvailabilityStore.getState();
  const hasUsableCache =
    cachedAvailability.availabilityUserId === userId &&
    !cachedAvailability.practiceLoading &&
    cachedAvailability.practiceError === null;

  if (hasUsableCache) return hasReachedReviewLimit(cachedAvailability);

  try {
    const reviewAvailability = await loadReviewAvailabilityFromArrays(userId);
    return hasReachedReviewLimit(reviewAvailability);
  } catch (error) {
    reportError(
      'Failed to check review availability before initial training; allowing training to continue',
      toError(error),
    );
    return false;
  }
}

function emptyInitialTrainingData(): InitialTrainingData {
  return { lesson: null, items: [], entries: [], grammar: null, grammarGroup: null };
}
