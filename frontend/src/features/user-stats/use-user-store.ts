import { create } from 'zustand';
import type { UserStats } from '@/types/local.types';
import UserScore from '@/database/models/user-scores';
import Levels from '@/database/models/levels';

interface UserState {
  userStats: UserStats;
  reloadUserStats: (userId: string) => Promise<void>;
  clearUserStats: () => void;
}

const initialUserStats: UserStats = { levelsOverview: [], practiceCountToday: 0 };

/**
 * Zustand store for managing user statistics and related operations.
 *
 * Features:
 * - Listens to 'userItemsUpdated' events and automatically reloads user stats
 * - Caches user stats in localStorage for persistence
 * - Provides methods to reload and clear user statistics
 *
 * @returns {UserState} The user store with the following properties and methods:
 * @property {UserStats} userStats - Current user statistics
 * @property {(userId: string) => Promise<void>} reloadUserStats - Fetches and updates user statistics from the server, including today's score, started counts, and total items count. Results are cached in localStorage.
 * @property {() => void} clearUserStats - Clears user statistics from both localStorage and the store state
 */
export const useUserStore = create<UserState>((set, get) => {
  let userItemsUpdatedListener: ((event: any) => void) | undefined;
  if (typeof window !== 'undefined') {
    userItemsUpdatedListener = (event: any) => {
      const { userId } = event.detail || {};
      if (userId) {
        get().reloadUserStats(userId);
      }
    };
    window.addEventListener('userItemsUpdated', userItemsUpdatedListener);
  }
  const store: UserState = {
    userStats: initialUserStats,
    reloadUserStats: async (userId: string) => {
      try {
        const todayScore = await UserScore.getOrCreateTodayScore(userId);
        const levelsOverview = await Levels.getOverview(userId);
        const stats: UserStats = {
          levelsOverview: Array.isArray(levelsOverview) ? levelsOverview : [],
          practiceCountToday:
            typeof todayScore?.item_count === 'number' ? todayScore.item_count : 0,
        };
        set({ userStats: stats });
      } catch (error) {
        set({ userStats: initialUserStats });
      }
    },
    clearUserStats: () => {
      try {
        set({ userStats: initialUserStats });
      } catch {
        // Ignore storage errors
      }
    },
  };
  (store as any).cleanup = () => {
    if (typeof window !== 'undefined' && userItemsUpdatedListener) {
      window.removeEventListener('userItemsUpdated', userItemsUpdatedListener);
    }
  };
  return store;
});
