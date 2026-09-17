import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import type { PracticeSessionType } from '@/types/practice-session.types';

export type PracticeAvailabilitySnapshot = Readonly<{
  reviewReadyAt: string | null;
  initialTrainingAvailable: boolean;
  activeSession: PracticeSessionType | null;
  requiresSessionReconciliation: boolean;
}>;

/** Loads the complete availability snapshot used by the practice actions on Home. */
export async function loadPracticeAvailabilitySnapshot(
  userId: string,
): Promise<PracticeAvailabilitySnapshot> {
  const [review, nextSelection, activeSessionState] = await Promise.all([
    UserItem.getReadyReviewState(userId),
    UserItem.getNextInitialTrainingSelection(userId),
    PracticeSession.inspectActive(userId),
  ]);

  return {
    reviewReadyAt: review.reviewReadyAt,
    initialTrainingAvailable: nextSelection != null,
    activeSession: activeSessionState.activeSession,
    requiresSessionReconciliation: activeSessionState.requiresReconciliation,
  };
}
