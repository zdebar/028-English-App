import { useEffect, useRef } from 'react';
import config from '@/config/config';
import { useUserStore } from './use-user-store';

export function useDailyStatsReset(userId: string | null) {
  const lastDateRef = useRef(new Date().toLocaleDateString('en-CA'));
  const reloadLevels = useUserStore((state) => state.reloadLevels);
  const reloadDailyCount = useUserStore((state) => state.reloadDailyCount);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentDate = new Date().toLocaleDateString('en-CA');
      if (currentDate !== lastDateRef.current) {
        lastDateRef.current = currentDate;
        if (userId) {
          reloadLevels(userId);
          reloadDailyCount(userId);
        }
      }
    }, config.sync.scoreResetCheckInterval);

    return () => clearInterval(intervalId);
  }, [userId, reloadLevels, reloadDailyCount]);
}
