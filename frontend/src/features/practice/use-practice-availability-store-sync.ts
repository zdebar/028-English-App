import { useEffect } from 'react';
import { clearSharedQueriesExcept } from '@/hooks/shared-query-store';
import { ensurePracticeAvailability, resetPracticeAvailability } from './practice-availability-controller';

/** Initializes account data once; navigation and individual answers do not refresh it. */
export function usePracticeAvailabilityStoreSync(userId: string | null): void {
  useEffect(() => {
    clearSharedQueriesExcept(userId);
    if (!userId) {
      resetPracticeAvailability();
      return;
    }
    void ensurePracticeAvailability(userId);
  }, [userId]);
}
