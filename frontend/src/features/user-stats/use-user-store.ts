import { create } from 'zustand';
import type { LevelOverviewType } from '@/types/generic.types';
import UserScoreType from '@/database/models/user-scores';
import Levels from '@/database/models/levels';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { reportError } from '../logging/monitoring-handler';

interface UserState {
  levels: LevelOverviewType[];
  levelsLoading: boolean;
  levelsError: Error | null;
  dailyCount: number;
  dailyCountLoading: boolean;
  dailyCountError: Error | null;
  showMasteredDashboard: boolean;
  setMasteredDashboard: (value: boolean) => void;
  reloadLevels: (userId: string) => Promise<void>;
  reloadDailyCount: (userId: string) => Promise<void>;
  clearLevels: () => void;
  clearDailyCount: () => void;
}

const initialLevels: LevelOverviewType[] = [];
const initialDailyStats = 0;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Stores user dashboard progress and listens for global progress update events.
 *
 * @returns Zustand hook with level overview, daily count, loading/error flags, and reload/clear actions.
 * The store reloads levels on levelsUpdated events and updates or reloads daily count on
 * dailyCountUpdated events when event.detail.userId is present.
 */
export const useUserStore = create<UserState>((set, get) => {
  let levelsUpdatedListener: ((event: any) => void) | undefined;
  let dailyCountUpdatedListener: ((event: any) => void) | undefined;
  if (typeof globalThis !== 'undefined') {
    levelsUpdatedListener = (event: any) => {
      const { userId } = event.detail || {};
      if (userId) {
        get().reloadLevels(userId);
      }
    };
    globalThis.addEventListener('levelsUpdated', levelsUpdatedListener);
    dailyCountUpdatedListener = (event: any) => {
      const { userId, dailyCount } = event.detail || {};
      if (!userId) {
        return;
      }

      if (typeof dailyCount === 'number') {
        set({ dailyCount });
      } else {
        get().reloadDailyCount(userId);
      }
    };
    globalThis.addEventListener('dailyCountUpdated', dailyCountUpdatedListener);
  }
  const store: UserState = {
    levels: initialLevels,
    levelsLoading: true,
    levelsError: null,
    dailyCount: initialDailyStats,
    dailyCountLoading: false,
    dailyCountError: null,
    showMasteredDashboard: false,
    setMasteredDashboard: (value: boolean) => {
      set({ showMasteredDashboard: value });
    },
    reloadLevels: async (userId: string) => {
      set({ levelsLoading: true, levelsError: null });
      try {
        assertNonEmptyString(userId, 'userId');
        const updatedLevels = (await Levels.getOverview(userId)) ?? [];
        set({ levels: updatedLevels, levelsLoading: false });
      } catch (error) {
        set({ levels: initialLevels, levelsLoading: false, levelsError: toError(error) });
        reportError('Error reloading levels', error);
      }
    },
    reloadDailyCount: async (userId: string) => {
      set({ dailyCountLoading: true, dailyCountError: null });
      try {
        assertNonEmptyString(userId, 'userId');
        const updatedCount = (await UserScoreType.getOrCreateTodayScore(userId)) ?? 0;
        set({ dailyCount: updatedCount, dailyCountLoading: false });
      } catch (error) {
        set({
          dailyCount: initialDailyStats,
          dailyCountLoading: false,
          dailyCountError: toError(error),
        });
        reportError('Error reloading daily count', error);
      }
    },
    clearLevels: () => {
      set({ levels: initialLevels, levelsLoading: false, levelsError: null });
    },
    clearDailyCount: () => {
      set({ dailyCount: initialDailyStats, dailyCountLoading: false, dailyCountError: null });
    },
  };
  return store;
});
