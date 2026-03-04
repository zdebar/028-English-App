import { useEffect } from 'react';
import { useUserStore } from './use-user-store';

/**
 * Custom hook to automatically reset user stats on sign-off (userId becomes null).
 *
 * @param userId The current user ID (null when signed out)
 */
export function useUserStoreReset(userId: string | null) {
  const clearItemsStats = useUserStore((state) => state.clearLevels);
  const clearScoresStats = useUserStore((state) => state.clearDailyCount);

  useEffect(() => {
    if (userId == null) {
      clearItemsStats();
      clearScoresStats();
    }
  }, [userId]);
}
