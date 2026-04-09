import { useEffect } from 'react';
import { useUserStore } from './use-user-store';
import { triggerDailyCountUpdatedEvent, triggerLevelsUpdatedEvent } from '../../utils/dashboard.utils';

/**
 * Custom hook to automatically reset user stats on sign-off (userId becomes null).
 *
 * @param userId The current user ID (null when signed out)
 */
export function useUserStoreSync(userId: string | null) {
  const clearItemsStats = useUserStore((state) => state.clearLevels);
  const clearScoresStats = useUserStore((state) => state.clearDailyCount);

  useEffect(() => {
    if (userId == null) {
      clearItemsStats();
      clearScoresStats();
    } else {
      triggerDailyCountUpdatedEvent(userId);
      triggerLevelsUpdatedEvent(userId);
    }
  }, [userId, clearItemsStats, clearScoresStats]);
}
