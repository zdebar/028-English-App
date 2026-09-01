import config from '@/config/config';
import Levels from '@/database/models/levels';
import { reportError } from '@/features/logging/monitoring-handler';
import type { LevelOverviewType } from '@/types/generic.types';
import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
import { useUserStore } from './use-user-store';

function getLocalDate(): string {
  return new Date(Date.now()).toLocaleDateString('en-CA');
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function getStartedTodayCount(levels: LevelOverviewType[]): number {
  return levels.reduce((total, level) => total + level.startedTodayCount, 0);
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
      startedTodayCount: 0,
    });

    const levelsSubscription = liveQuery(() => Levels.getOverview(userId, localDate)).subscribe({
      next: (levels) => {
        if (isActive) {
          const nextLevels = levels ?? [];
          useUserStore.setState({
            levels: nextLevels,
            levelsLoading: false,
            levelsError: null,
            startedTodayCount: getStartedTodayCount(nextLevels),
          });
        }
      },
      error: (error) => {
        if (isActive) {
          useUserStore.setState({
            levels: [],
            levelsLoading: false,
            levelsError: toError(error),
            startedTodayCount: 0,
          });
          reportError('Error observing levels', error);
        }
      },
    });

    return () => {
      isActive = false;
      levelsSubscription.unsubscribe();
    };
  }, [userId, localDate, clearItemsStats]);
}
