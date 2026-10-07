import PracticeSession from '@/database/models/practice-sessions';
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
}>;

/** Loads the complete availability snapshot used by the practice actions on Home. */
export async function loadPracticeAvailabilitySnapshot(
  userId: string,
): Promise<PracticeAvailabilitySnapshot> {
  const activeSessionState = await PracticeSession.inspectActive(userId);
  const [review, nextInitialBlock] = await Promise.all([
    loadReviewAvailability(userId),
    getPrefetchedNextInitialBlock(userId, activeSessionState.activeSession),
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
