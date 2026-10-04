import { useEffect } from 'react';
import { clearSharedQueriesExcept } from '@/hooks/shared-query-store';
import {
  ensurePracticeAvailability,
  refreshPracticeAvailability,
  resetPracticeAvailability,
} from './practice-availability-controller';

/** Initializes account data and refreshes it when the app becomes visible again. */
export function usePracticeAvailabilityStoreSync(userId: string | null): void {
  useEffect(() => {
    clearSharedQueriesExcept(userId);
    if (!userId) {
      resetPracticeAvailability();
      return;
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'hidden') return;
      void refreshPracticeAvailability(userId);
    };

    const refreshOnFocus = () => {
      void refreshPracticeAvailability(userId);
    };

    document.addEventListener('visibilitychange', refreshWhenVisible);
    globalThis.addEventListener('focus', refreshOnFocus);
    void ensurePracticeAvailability(userId);

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      globalThis.removeEventListener('focus', refreshOnFocus);
    };
  }, [userId]);
}
