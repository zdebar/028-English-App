import PracticeSession from '@/database/models/practice-sessions';
import UserLesson from '@/database/models/user-lessons';
import UserSettings from '@/database/models/user-settings';
import UserItem from '@/database/models/user-items';
import config from '@/config/config';
import type { PracticeSessionType } from '@/types/practice-session.types';
import { loadReviewAvailabilityFromArrays } from './review-prefetch';
import { getPrefetchedNextInitialBlock } from './practice-prefetch';

export type PracticeAvailabilitySnapshot = Readonly<{
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  grammarReviewDueCount: number;
  vocabularyReviewDueCount: number;
  nextReviewAt: string | null;
  initialTrainingAvailable: boolean;
  activeSession: PracticeSessionType | null;
  requiresSessionReconciliation: boolean;
  newLessonsStartedTodayCount: number;
  maxNewLessonsPerDay: number;
}>;

/** Loads the complete availability snapshot used by the practice actions on Home. */
export async function loadPracticeAvailabilitySnapshot(
  userId: string,
): Promise<PracticeAvailabilitySnapshot> {
  const activeSessionState = await PracticeSession.inspectActive(userId);
  const [review, nextInitialBlock, settings, newLessonsStartedTodayCount] = await Promise.all([
    loadReviewAvailability(userId),
    getPrefetchedNextInitialBlock(userId, activeSessionState.activeSession),
    UserSettings.getOrCreate(userId),
    UserLesson.getStartedCountForToday(userId),
  ]);

  return {
    grammarReviewReadyAt: review.grammarReviewReadyAt,
    vocabularyReviewReadyAt: review.vocabularyReviewReadyAt,
    grammarReviewDueCount: review.grammarReviewDueCount,
    vocabularyReviewDueCount: review.vocabularyReviewDueCount,
    nextReviewAt: review.nextReviewAt,
    initialTrainingAvailable:
      activeSessionState.activeSession?.mode === 'new' || nextInitialBlock !== null,
    activeSession: activeSessionState.activeSession,
    requiresSessionReconciliation: activeSessionState.requiresReconciliation,
    newLessonsStartedTodayCount,
    maxNewLessonsPerDay: settings.max_new_lessons_per_day,
  };
}

export function hasReachedDailyNewLessonLimit(
  availability: Pick<PracticeAvailabilitySnapshot, 'newLessonsStartedTodayCount' | 'maxNewLessonsPerDay'>,
): boolean {
  return availability.newLessonsStartedTodayCount >= availability.maxNewLessonsPerDay;
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
