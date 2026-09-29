import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import type { PracticeSessionType } from '@/types/practice-session.types';
import { loadReviewAvailabilityFromArrays } from './review-prefetch';

export type PracticeAvailabilitySnapshot = Readonly<{
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  initialTrainingAvailable: boolean;
  activeSession: PracticeSessionType | null;
  requiresSessionReconciliation: boolean;
}>;

/** Loads the complete availability snapshot used by the practice actions on Home. */
export async function loadPracticeAvailabilitySnapshot(
  userId: string,
): Promise<PracticeAvailabilitySnapshot> {
  const [review, nextSelection, activeSessionState] = await Promise.all([
    loadReviewAvailability(userId),
    UserItem.getNextInitialTrainingSelection(userId),
    PracticeSession.inspectActive(userId),
  ]);

  return {
    grammarReviewReadyAt: review.grammarReviewReadyAt,
    vocabularyReviewReadyAt: review.vocabularyReviewReadyAt,
    initialTrainingAvailable: nextSelection != null,
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
