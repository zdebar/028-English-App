import PracticeSession from '@/database/models/practice-sessions';
import config from '@/config/config';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { loadPracticeAvailabilitySnapshot } from './practice-availability';
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
    usePracticeAvailabilityStore.setState({ practiceLoading: true });
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
  if (snapshot.requiresSessionReconciliation) {
    await PracticeSession.reconcileActive(context.userId);
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
  if (nextReviewAt === null) return;

  const nextReviewTime = Date.parse(nextReviewAt);
  if (!Number.isFinite(nextReviewTime) || nextReviewTime <= Date.now()) return;

  const delay = Math.min(
    config.practice.maxReviewReadyTimerDelayMs,
    Math.max(1, nextReviewTime - Date.now() + 1),
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
