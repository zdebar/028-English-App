import config from '@/config/config';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { loadPracticeAvailabilitySnapshot } from './practice-availability';
import { loadReviewAvailabilityFromArrays } from './review-prefetch';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';

type AvailabilityContext = {
  userId: string;
  practiceDepth: number;
  dirty: boolean;
  pending: Promise<void> | null;
  reviewTimer: ReturnType<typeof setTimeout> | null;
};

let current: AvailabilityContext | null = null;

export function resetPracticeAvailability(): void {
  if (current) clearReviewAvailabilityTimer(current);
  current = null;
  usePracticeAvailabilityStore.getState().reset();
}

function getContext(userId: string): AvailabilityContext {
  if (current?.userId === userId && usePracticeAvailabilityStore.getState().availabilityUserId === userId) {
    return current;
  }
  current = {
    userId,
    practiceDepth: 0,
    dirty: false,
    pending: null,
    reviewTimer: null,
  };
  usePracticeAvailabilityStore.getState().setLoading(userId);
  return current;
}

/** Initial load only. Ordinary navigation reuses the prepared snapshot. */
export async function ensurePracticeAvailability(userId: string): Promise<void> {
  const context = getContext(userId);
  const state = usePracticeAvailabilityStore.getState();
  if (context.pending !== null) return context.pending;
  if (!state.practiceLoading) return;
  return refreshPracticeAvailability(userId);
}

/** Updates review counts from the current bidirectional cache after a saved answer. */
export async function refreshPracticeReviewAvailability(userId: string): Promise<void> {
  try {
    const reviewAvailability = await loadReviewAvailabilityFromArrays(userId);
    usePracticeAvailabilityStore.getState().setReviewSnapshot(userId, reviewAvailability);
  } catch (error) {
    reportError(
      'Failed to refresh review availability after practice progress',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/** Called after sync/reset; while practicing, coalesces changes until exit. */
export function refreshPracticeAvailability(userId: string): Promise<void> {
  // A late sync/save belonging to a previous account must not replace the current account.
  if (current?.userId !== userId) return Promise.resolve();
  const context = current;
  context.dirty = true;
  clearReviewAvailabilityTimer(context);
  if (context.practiceDepth > 0) return Promise.resolve();
  if (context.pending !== null) return context.pending;
  context.pending = refreshContext(context).finally(() => {
    context.pending = null;
  });
  return context.pending;
}

async function refreshContext(context: AvailabilityContext): Promise<void> {
  while (current === context && context.dirty && context.practiceDepth === 0) {
    context.dirty = false;
    try {
      await updateSnapshot(context);
    } catch (error) {
      if (current !== context) return;
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      usePracticeAvailabilityStore.getState().setError(context.userId, normalizedError);
      reportError('Failed to load Home practice availability', normalizedError);
      useToastStore.getState().showToast(TEXTS.loadingError, 'error');
    }
  }
}

async function updateSnapshot(context: AvailabilityContext): Promise<void> {
  const snapshot = await loadPracticeAvailabilitySnapshot(context.userId);
  if (current !== context) return;
  if (context.practiceDepth > 0) {
    context.dirty = true;
    return;
  }
  if (!context.dirty) {
    usePracticeAvailabilityStore.getState().setSnapshot(context.userId, snapshot);
    scheduleReviewAvailabilityRefresh(context, snapshot.nextReviewAt);
  }
}

function scheduleReviewAvailabilityRefresh(
  context: AvailabilityContext,
  nextReviewAt: string | null,
): void {
  clearReviewAvailabilityTimer(context);
  const now = new Date();
  const nextLocalDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const nextReviewTime = nextReviewAt === null ? Number.POSITIVE_INFINITY : Date.parse(nextReviewAt);
  const reviewDelay = Number.isFinite(nextReviewTime) && nextReviewTime > now.getTime()
    ? nextReviewTime - now.getTime() + 1
    : Number.POSITIVE_INFINITY;
  const delay = Math.min(
    config.practice.maxReviewReadyTimerDelayMs,
    Math.max(1, Math.min(reviewDelay, nextLocalDay - now.getTime())),
  );
  context.reviewTimer = globalThis.setTimeout(() => {
    context.reviewTimer = null;
    if (current !== context) return;
    void refreshPracticeAvailability(context.userId);
  }, delay);
}

function clearReviewAvailabilityTimer(context: AvailabilityContext): void {
  if (context.reviewTimer === null) return;
  globalThis.clearTimeout(context.reviewTimer);
  context.reviewTimer = null;
}

/** The returned exit action runs only after the caller has settled its pending writes. */
export function beginPracticeAvailabilityBoundary(userId: string): () => Promise<void> {
  const context = getContext(userId);
  context.practiceDepth += 1;
  return async () => {
    context.practiceDepth -= 1;
    if (current !== context) return;
    await refreshPracticeAvailability(userId);
  };
}
