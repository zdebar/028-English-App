import { create } from 'zustand';
import type { LevelOverviewType } from '@/types/generic.types';
import UserScoreType from '@/database/models/user-scores';
import Levels from '@/database/models/levels';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { errorHandler } from '../logging/error-handler';

interface UserState {
  levels: LevelOverviewType[];
  dailyCount: number;
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
 * @returns {UserState & { cleanup: () => void }} The user store with state management methods:
 * - `levels` - Array of user level data
 * - `dailyCount` - Today's score count for the user
 * - `showMasteredDashboard` - Whether to show mastered lessons on the dashboard
 * - `showMasteredLevels` - Whether to show mastered levels in the levels overview
 * - `reloadLevels(userId)` - Fetches and updates user levels from the server
 * - `reloadScoresStats(userId)` - Fetches and updates daily score statistics
 * - `setMasteredDashboard(value)` - Toggles display of mastered lessons on the dashboard
 * - `setMasteredLevels(value)` - Toggles display of mastered levels in the levels overview
 * - `clearItemsStats()` - Resets levels to initial state
 * - `clearScoresStats()` - Resets daily count to initial state
 * - `cleanup()` - Removes event listeners (should be called on store destruction)
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
      const { userId } = event.detail || {};
      if (userId) {
        get().reloadDailyCount(userId);
      }
    };
    globalThis.addEventListener('dailyCountUpdated', dailyCountUpdatedListener);
  }
  const store: UserState = {
    levels: initialLevels,
    dailyCount: initialDailyStats,
    showMasteredDashboard: false,
    setMasteredDashboard: (value: boolean) => {
      set({ showMasteredDashboard: value });
    },
    reloadLevels: async (userId: string) => {
      try {
        assertNonEmptyString(userId, 'userId');
        const updatedLevels = (await Levels.getOverview(userId)) ?? [];
        set({ levels: updatedLevels });
      } catch (error) {
        set({ levels: initialLevels });
        errorHandler('Error reloading levels', error);
      }
    },
    reloadDailyCount: async (userId: string) => {
      try {
        assertNonEmptyString(userId, 'userId');
        const updatedCount = (await UserScoreType.getOrCreateTodayScore(userId)) ?? 0;
        set({ dailyCount: updatedCount });
      } catch (error) {
        set({ dailyCount: initialDailyStats });
        errorHandler('Error reloading daily count', error);
      }
    },
    clearLevels: () => {
      set({ levels: initialLevels });
    },
    clearDailyCount: () => {
      set({ dailyCount: initialDailyStats });
    },
  };
  (store as any).cleanup = () => {
    if (typeof globalThis !== 'undefined') {
      if (levelsUpdatedListener) {
        globalThis.removeEventListener('levelsUpdated', levelsUpdatedListener);
      }
      if (dailyCountUpdatedListener) {
        globalThis.removeEventListener('dailyCountUpdated', dailyCountUpdatedListener);
      }
    }
  };
  return store;
});
