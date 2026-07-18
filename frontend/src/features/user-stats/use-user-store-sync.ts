import config from '@/config/config';
import Levels from '@/database/models/levels';
import UserScore from '@/database/models/user-scores';
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
  const clearScoresStats = useUserStore((state) => state.clearDailyCount);

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
      dailyCount: 0,
      dailyCountLoading: true,
      dailyCountError: null,
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

    const dailyCountSubscription = liveQuery(() =>
      UserScore.getScoreForDate(userId, localDate),
    ).subscribe({
      next: (dailyCount) => {
        if (isActive) {
          useUserStore.setState({
            dailyCount: dailyCount ?? 0,
            dailyCountLoading: false,
            dailyCountError: null,
          });
        }
      },
      error: (error) => {
        if (isActive) {
          useUserStore.setState({
            dailyCount: 0,
            dailyCountLoading: false,
            dailyCountError: toError(error),
          });
          reportError('Error observing daily count', error);
        }
      },
    });

    return () => {
      isActive = false;
      levelsSubscription.unsubscribe();
      dailyCountSubscription.unsubscribe();
    };
  }, [userId, localDate, clearItemsStats, clearScoresStats]);
}
