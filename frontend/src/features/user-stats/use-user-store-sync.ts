import config from '@/config/config';
import Levels from '@/database/models/levels';
import UserItemProgressHistory from '@/database/models/user-item-progress-history';
import { reportError } from '@/features/logging/monitoring-handler';
import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
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
  const clearScoresStats = useUserStore((state) => state.clearDailyProgressChange);

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
      clearScoresStats();
      return;
    }

    let isActive = true;
    useUserStore.setState({
      levels: [],
      levelsLoading: true,
      levelsError: null,
      dailyProgressChange: 0,
      dailyProgressChangeLoading: true,
      dailyProgressChangeError: null,
    });

    const levelsSubscription = liveQuery(() => Levels.getOverview(userId, localDate)).subscribe({
      next: (levels) => {
        if (isActive) {
          useUserStore.setState({ levels: levels ?? [], levelsLoading: false, levelsError: null });
        }
      },
      error: (error) => {
        if (isActive) {
          useUserStore.setState({
            levels: [],
            levelsLoading: false,
            levelsError: toError(error),
          });
          reportError('Error observing levels', error);
        }
      },
    });

    const dailyProgressChangeSubscription = liveQuery(() =>
      UserItemProgressHistory.getTodayProgressChange(userId, localDate),
    ).subscribe({
      next: (dailyProgressChange) => {
        if (isActive) {
          useUserStore.setState({
            dailyProgressChange: dailyProgressChange ?? 0,
            dailyProgressChangeLoading: false,
            dailyProgressChangeError: null,
          });
        }
      },
      error: (error) => {
        if (isActive) {
          useUserStore.setState({
            dailyProgressChange: 0,
            dailyProgressChangeLoading: false,
            dailyProgressChangeError: toError(error),
          });
          reportError('Error observing daily count', error);
        }
      },
    });

    return () => {
      isActive = false;
      levelsSubscription.unsubscribe();
      dailyProgressChangeSubscription.unsubscribe();
    };
  }, [userId, localDate, clearItemsStats, clearScoresStats]);
}
