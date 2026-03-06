import { create } from 'zustand';
import type { LevelOverview } from '@/types/local.types';
import UserScore from '@/database/models/user-scores';
import Levels from '@/database/models/levels';
import { assertNonEmptyString } from '@/utils/assertions.utils';

interface UserState {
  levels: LevelOverview[];
  dailyCount: number;
  reloadLevels: (userId: string) => Promise<void>;
  reloadDailyCount: (userId: string) => Promise<void>;
  clearLevels: () => void;
  clearDailyCount: () => void;
}

const initialLevels: LevelOverview[] = [];
const initialDailyStats = 0;

/**
 * Creates a Zustand store for managing user statistics and state.
 *
 * Handles levels and daily score statistics with automatic updates via custom window events.
 * Sets up event listeners for 'levelsUpdated' and 'dailyCountUpdated' events that trigger
 * store reloads when a userId is provided in the event detail.
 *
 * @returns {UserState & { cleanup: () => void }} The user store with state management methods:
 * - `levels` - Array of user level data
 * - `dailyCount` - Today's score count for the user
 * - `reloadLevels(userId)` - Fetches and updates user levels from the server
 * - `reloadScoresStats(userId)` - Fetches and updates daily score statistics
 * - `clearItemsStats()` - Resets levels to initial state
 * - `clearScoresStats()` - Resets daily count to initial state
 * - `cleanup()` - Removes event listeners (should be called on store destruction)
 */
export const useUserStore = create<UserState>((set, get) => {
  let levelsUpdatedListener: ((event: any) => void) | undefined;
  let dailyCountUpdatedListener: ((event: any) => void) | undefined;
  if (typeof window !== 'undefined') {
    levelsUpdatedListener = (event: any) => {
      const { userId } = event.detail || {};
      if (userId) {
        get().reloadLevels(userId);
      }
    };
    window.addEventListener('levelsUpdated', levelsUpdatedListener);
    dailyCountUpdatedListener = (event: any) => {
      const { userId } = event.detail || {};
      if (userId) {
        get().reloadDailyCount(userId);
      }
    };
    window.addEventListener('dailyCountUpdated', dailyCountUpdatedListener);
  }
  const store: UserState = {
    levels: initialLevels,
    dailyCount: initialDailyStats,
    reloadLevels: async (userId: string) => {
      try {
        assertNonEmptyString(userId, 'userId');
        const updatedLevels = (await Levels.getOverview(userId)) ?? [];
        set({ levels: updatedLevels });
      } catch (error) {
        set({ levels: initialLevels });
      }
    },
    reloadDailyCount: async (userId: string) => {
      try {
        assertNonEmptyString(userId, 'userId');
        const updatedCount = (await UserScore.getOrCreateTodayScore(userId)) ?? 0;
        set({ dailyCount: updatedCount });
      } catch (error) {
        set({ dailyCount: initialDailyStats });
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
    if (typeof window !== 'undefined') {
      if (levelsUpdatedListener) {
        window.removeEventListener('levelsUpdated', levelsUpdatedListener);
      }
      if (dailyCountUpdatedListener) {
        window.removeEventListener('dailyCountUpdated', dailyCountUpdatedListener);
      }
    }
  };
  return store;
});
