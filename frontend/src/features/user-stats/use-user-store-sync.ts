import config from '@/config/config';
import Levels from '@/database/models/levels';
import { reportError } from '@/features/logging/monitoring-handler';
import { useEffect, useState } from 'react';
import { observeSharedQuery, sharedQueryKey } from '@/hooks/shared-query-store';
import { useUserStore } from './use-user-store';

function getLocalDate(): string {
  return new Date(Date.now()).toLocaleDateString('en-CA');
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Custom hook to automatically reset user stats on sign-off (userId becomes null).
 *
 * @param userId The current user ID (null when signed out)
 */
export function useUserStoreSync(userId: string | null) {
  const [localDate, setLocalDate] = useState(getLocalDate);
  const clearItemsStats = useUserStore((state) => state.clearLevels);

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      setLocalDate((currentDate) => {
        const nextDate = getLocalDate();
        return currentDate === nextDate ? currentDate : nextDate;
      });
    }, config.sync.scoreResetCheckInterval);

    return () => globalThis.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (userId == null) {
      clearItemsStats();
      return;
    }

    let isActive = true;
    useUserStore.setState({
      levels: [],
      levelsLoading: true,
      levelsError: null,
    });

    const key = sharedQueryKey(userId, `user-stats:${localDate}`)!;
    const unsubscribe = observeSharedQuery(key, 'user-stats', () => Levels.getOverview(userId, localDate), ({ data: levels, error }) => {
      if (error) {
        useUserStore.setState({ levels: [], levelsLoading: false, levelsError: toError(error) });
        reportError('Error observing levels', error);
        return;
      }
      if (levels) {
        if (isActive) {
          const nextLevels = levels ?? [];
          useUserStore.setState({
            levels: nextLevels,
            levelsLoading: false,
            levelsError: null,
          });
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [userId, localDate, clearItemsStats]);
}
