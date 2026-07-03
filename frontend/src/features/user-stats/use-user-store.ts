import { create } from 'zustand';
import type { LevelOverviewType } from '@/types/generic.types';
import UserScoreType from '@/database/models/user-scores';
import Levels from '@/database/models/levels';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { reportError } from '../logging/monitoring-handler';

interface UserState {
  levels: LevelOverviewType[];
  levelsLoading: boolean;
  levelsError: unknown | null;
  dailyCount: number;
  dailyCountLoading: boolean;
  dailyCountError: unknown | null;
  showMasteredDashboard: boolean;
  setMasteredDashboard: (value: boolean) => void;
  reloadLevels: (userId: string) => Promise<void>;
  reloadDailyCount: (userId: string) => Promise<void>;
  clearLevels: () => void;
  clearDailyCount: () => void;
}

const initialLevels: LevelOverviewType[] = [];
const initialDailyStats = 0;

/**
 * Creates a Zustand store for managing user statistics and state.
 *
 * Handles levels and daily score statistics with automatic updates via custom globalThis events.
 * Sets up event listeners for 'levelsUpdated' and 'dailyCountUpdated' events that trigger
 * store reloads when a userId is provided in the event detail.
 *
 * @returns {UserState} The user store with state management methods:
 * - `levels` - Array of user level data
 * - `dailyCount` - Today's score count for the user
 * - `showMasteredDashboard` - Whether to show mastered lessons on the dashboard
 * - `reloadLevels(userId)` - Fetches and updates user levels from the server
 * - `reloadDailyCount(userId)` - Fetches and updates daily score statistics
 * - `setMasteredDashboard(value)` - Toggles display of mastered lessons on the dashboard
 * - `clearLevels()` - Resets levels to initial state
 * - `clearDailyCount()` - Resets daily count to initial state
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
    levelsLoading: false,
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
        set({ levels: initialLevels, levelsLoading: false, levelsError: error });
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
        set({ dailyCount: initialDailyStats, dailyCountLoading: false, dailyCountError: error });
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
