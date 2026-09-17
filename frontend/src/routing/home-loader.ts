import { waitForAuthReady } from '@/features/auth/auth-lifecycle';
import { loadPracticeAvailabilitySnapshot } from '@/features/practice/practice-availability';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';

export async function loadHome(): Promise<null> {
  await waitForAuthReady();
  const userId = useAuthStore.getState().userId;
  if (!userId) {
    usePracticeAvailabilityStore.getState().reset();
    return null;
  }

  const availabilityStore = usePracticeAvailabilityStore.getState();
  availabilityStore.setLoading(userId);

  try {
    const snapshot = await loadPracticeAvailabilitySnapshot(userId);
    availabilityStore.setSnapshot(userId, snapshot);
  } catch (error) {
    const normalizedError = toError(error);
    availabilityStore.setError(userId, normalizedError);
    reportError('Failed to load Home practice availability', normalizedError);
    useToastStore.getState().showToast(TEXTS.loadingError, 'error');
  }

  return null;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
