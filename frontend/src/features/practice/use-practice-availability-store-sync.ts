import config from '@/config/config';
import UserItem from '@/database/models/user-items';
import PracticeSession from '@/database/models/practice-sessions';
import { reportError } from '@/features/logging/monitoring-handler';
import { liveQuery } from 'dexie';
import { useLayoutEffect, useEffect } from 'react';
import { loadPracticeAvailabilitySnapshot } from './practice-availability';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Keeps Home practice availability synchronized while Home is active. */
export function usePracticeAvailabilityStoreSync(userId: string | null): void {
  const reset = usePracticeAvailabilityStore((state) => state.reset);
  const reviewReadyAt = usePracticeAvailabilityStore((state) => state.reviewReadyAt);
  const setLoading = usePracticeAvailabilityStore((state) => state.setLoading);
  const setSnapshot = usePracticeAvailabilityStore((state) => state.setSnapshot);
  const setError = usePracticeAvailabilityStore((state) => state.setError);

  useLayoutEffect(() => {
    if (!userId) {
      reset();
      return;
    }

    let isActive = true;
    const currentState = usePracticeAvailabilityStore.getState();
    const hasReadySnapshot =
      currentState.availabilityUserId === userId && !currentState.practiceLoading;
    if (!hasReadySnapshot) setLoading(userId);

    const readySubscription = liveQuery(() => loadPracticeAvailabilitySnapshot(userId)).subscribe({
      next: (state) => {
        if (!isActive) return;
        setSnapshot(userId, state);
        if (state.requiresSessionReconciliation) {
          void PracticeSession.reconcileActive(userId).catch((error: unknown) => {
            reportError('Failed to remove invalid practice session', toError(error));
          });
        }
      },
      error: (error) => {
        if (!isActive) return;
        const normalizedError = toError(error);
        setError(userId, normalizedError);
        reportError('Failed to load unified practice button state', normalizedError);
      },
    });

    return () => {
      isActive = false;
      readySubscription.unsubscribe();
    };
  }, [reset, userId]);

  useEffect(() => {
    if (!userId || reviewReadyAt === null) return;

    const nextTime = Date.parse(reviewReadyAt);
    if (!Number.isFinite(nextTime) || nextTime <= Date.now()) return;

    const delay = Math.min(
      nextTime - Date.now(),
      config.practice.maxReviewReadyTimerDelayMs,
    );
    const timeoutId = globalThis.setTimeout(() => {
      void UserItem.getReadyReviewState(userId)
        .then((state) => {
          usePracticeAvailabilityStore.setState({ reviewReadyAt: state.reviewReadyAt });
        })
        .catch((error: unknown) => {
          const normalizedError = toError(error);
          usePracticeAvailabilityStore.setState({
            reviewReadyAt: null,
            practiceError: normalizedError,
          });
          reportError('Failed to refresh review availability', normalizedError);
        });
    }, delay);

    return () => globalThis.clearTimeout(timeoutId);
  }, [reviewReadyAt, userId]);
}
