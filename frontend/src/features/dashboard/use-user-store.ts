import { create } from 'zustand';
import type { UserStatsLocal } from '@/types/local.types';
import UserScore from '@/database/models/user-scores';
import UserItem from '@/database/models/user-items';

interface UserState {
  userId: string;
  userStats: UserStatsLocal | null;
  reloadUserStats: () => Promise<void>;
  clearUserStats: () => void;
  setUserId: (userId: string) => void;
}

const getUserStatsKey = (userId: string) => `user-stats_${userId}`;

export const useUserStore = create<UserState>((set, get) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('userItemsUpdated', (event: any) => {
      const { userId } = event.detail || {};
      if (userId) {
        get().setUserId(userId);
        get().reloadUserStats();
      }
    });
  }

  return {
    userId: 'anonymous',
    userStats: null,

    setUserId: (userId: string) => set({ userId }),

    reloadUserStats: async () => {
      const userId = get().userId || 'guest';
      try {
        const todayScore = await UserScore.getUserScoreForToday(userId);
        const startedCounts = await UserItem.getStartedCounts(userId);

        const stats: UserStatsLocal = {
          startedCountToday: startedCounts?.startedCountToday || 0,
          startedCount: startedCounts?.startedCount || 0,
          practiceCountToday: todayScore?.item_count || 0,
        };

        localStorage.setItem(getUserStatsKey(userId), JSON.stringify(stats));
        set({ userStats: stats });
      } catch (error) {
        set({ userStats: null });
      }
    },

    clearUserStats: () => {
      const userId = get().userId || 'guest';
      try {
        localStorage.removeItem(getUserStatsKey(userId));
        set({ userStats: null });
      } catch {
        // Ignore storage errors
      }
    },
  };
});
