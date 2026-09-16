import config from '@/config/config';
import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import PracticeSession from '@/database/models/practice-sessions';
import { reportError } from '@/features/logging/monitoring-handler';
import { liveQuery } from 'dexie';
import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Keeps Home practice availability synchronized while Home is active. */
export function usePracticeAvailabilityStoreSync(userId: string | null): void {
  const reset = usePracticeAvailabilityStore((state) => state.reset);
  const reviewReadyAt = usePracticeAvailabilityStore((state) => state.reviewReadyAt);
  const { pathname } = useLocation();
  const isHomeRoute = pathname === ROUTES.home;

  useLayoutEffect(() => {
    if (!userId || !isHomeRoute) {
      reset();
      return;
    }

    let isActive = true;
    usePracticeAvailabilityStore.setState({
      reviewReadyAt: null,
      initialTrainingAvailable: false,
      activeSession: null,
      practiceLoading: true,
      practiceError: null,
    });

    const readySubscription = liveQuery(async () => {
      const [review, nextSelection, activeSessionState] = await Promise.all([
        UserItem.getReadyReviewState(userId),
        UserItem.getNextInitialTrainingSelection(userId),
        PracticeSession.inspectActive(userId),
      ]);
      return {
        review,
        initialTrainingAvailable: nextSelection != null,
        activeSession: activeSessionState.activeSession,
        requiresSessionReconciliation: activeSessionState.requiresReconciliation,
      };
    }).subscribe({
      next: (state) => {
        if (!isActive) return;
        usePracticeAvailabilityStore.setState({
          reviewReadyAt: state.review.reviewReadyAt,
          initialTrainingAvailable: state.initialTrainingAvailable,
          activeSession: state.activeSession,
          practiceLoading: false,
          practiceError: null,
        });
        if (state.requiresSessionReconciliation) {
          void PracticeSession.reconcileActive(userId).catch((error: unknown) => {
            reportError('Failed to remove invalid practice session', toError(error));
          });
        }
      },
      error: (error) => {
        if (!isActive) return;
        const normalizedError = toError(error);
        usePracticeAvailabilityStore.setState({
          reviewReadyAt: null,
          initialTrainingAvailable: false,
          activeSession: null,
          practiceLoading: false,
          practiceError: normalizedError,
        });
        reportError('Failed to load unified practice button state', normalizedError);
      },
    });

    return () => {
      isActive = false;
      readySubscription.unsubscribe();
    };
  }, [isHomeRoute, reset, userId]);

  useEffect(() => {
    if (!userId || !isHomeRoute || reviewReadyAt === null) return;

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
  }, [isHomeRoute, reviewReadyAt, userId]);
}
