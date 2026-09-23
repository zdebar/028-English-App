import config from '@/config/config';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';
import {
  clearReviewDeckCacheExcept,
  prefetchReviewDeck,
} from './review-deck-cache';
import { useEffect, useState } from 'react';

function isReviewAvailable(
  reviewReadyAt: string | null,
  activeSession: { mode: 'review' | 'new' } | null,
  checkedAt: number,
): boolean {
  if (activeSession?.mode === 'review') return true;
  if (!reviewReadyAt) return false;
  return Date.parse(reviewReadyAt) <= Math.max(checkedAt, Date.now());
}

/** Warms the review deck while Home is visible, including on touch devices. */
export function useReviewDeckPrefetch(userId: string | null): void {
  const reviewReadyAt = usePracticeAvailabilityStore((state) => state.reviewReadyAt);
  const activeSession = usePracticeAvailabilityStore((state) => state.activeSession);
  const practiceLoading = usePracticeAvailabilityStore((state) => state.practiceLoading);
  const practiceError = usePracticeAvailabilityStore((state) => state.practiceError);
  const [checkedAt, setCheckedAt] = useState(Date.now);

  useEffect(() => {
    clearReviewDeckCacheExcept(userId);
  }, [userId]);

  useEffect(() => {
    if (!reviewReadyAt) return undefined;

    const remaining = Date.parse(reviewReadyAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) return undefined;

    const timeout = globalThis.setTimeout(
      () => setCheckedAt(Date.now()),
      Math.min(remaining, config.practice.maxReviewReadyTimerDelayMs),
    );
    return () => globalThis.clearTimeout(timeout);
  }, [reviewReadyAt, checkedAt]);

  useEffect(() => {
    if (
      !userId ||
      practiceLoading ||
      practiceError ||
      !isReviewAvailable(reviewReadyAt, activeSession, checkedAt)
    ) {
      return;
    }

    void prefetchReviewDeck(userId).catch(() => undefined);
  }, [activeSession, checkedAt, practiceError, practiceLoading, reviewReadyAt, userId]);
}
