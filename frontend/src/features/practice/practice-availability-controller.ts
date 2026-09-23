import PracticeSession from '@/database/models/practice-sessions';
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
};

let current: AvailabilityContext | null = null;

export function resetPracticeAvailability(): void {
  current = null;
  usePracticeAvailabilityStore.getState().reset();
}

function getContext(userId: string): AvailabilityContext {
  if (current?.userId === userId && usePracticeAvailabilityStore.getState().availabilityUserId === userId) {
    return current;
  }
  current = { userId, practiceDepth: 0, dirty: false, pending: null };
  usePracticeAvailabilityStore.getState().setLoading(userId);
  return current;
}

/** Initial load only. Ordinary navigation reuses the prepared snapshot. */
export async function ensurePracticeAvailability(userId: string): Promise<void> {
  const context = getContext(userId);
  const state = usePracticeAvailabilityStore.getState();
  if (context.pending) return context.pending;
  if (!state.practiceLoading) return;
  return refreshPracticeAvailability(userId);
}

/** Called after sync/reset; while practicing, coalesces changes until exit. */
export function refreshPracticeAvailability(userId: string): Promise<void> {
  // A late sync/save belonging to a previous account must not replace the current account.
  if (current?.userId !== userId) return Promise.resolve();
  const context = current;
  context.dirty = true;
  if (context.practiceDepth > 0) return Promise.resolve();
  if (context.pending) return context.pending;
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
  }
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
