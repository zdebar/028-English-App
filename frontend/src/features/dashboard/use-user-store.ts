import { create } from 'zustand';
import type { UserStatsLocal } from '@/types/local.types';
import UserScore from '@/database/models/user-scores';
import UserItem from '@/database/models/user-items';
import config from '@/config/config';

interface UserState {
  userStats: UserStatsLocal | null;
  reloadUserStats: (userId: string) => Promise<void>;
  clearUserStats: (userId: string) => void;
}

const getUserStatsKey = (userId: string) => `user-stats_${userId}`;

export const useUserStore = create<UserState>((set, get) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('userItemsUpdated', (event: any) => {
      const { userId } = event.detail || {};
      if (userId) {
        get().reloadUserStats(userId);
      }
    });
  }

  return {
    userStats: null,

    reloadUserStats: async (userId: string) => {
      try {
        const todayScore = await UserScore.getUserScoreForToday(userId);
        const startedCounts = await UserItem.getStartedCounts(userId);

        const stats: UserStatsLocal = {
          startedCountToday: startedCounts?.startedCountToday || 0,
          startedCount: startedCounts?.startedCount || 0,
          practiceCountToday: todayScore?.item_count || 0,
          totalItemsCount: (await UserItem.getUserItemsCount(userId)) || config.lesson.lessonSize,
        };

        localStorage.setItem(getUserStatsKey(userId), JSON.stringify(stats));
        set({ userStats: stats });
      } catch (error) {
        set({ userStats: null });
      }
    },

    clearUserStats: (userId: string) => {
      try {
        localStorage.removeItem(getUserStatsKey(userId));
        set({ userStats: null });
      } catch {
        // Ignore storage errors
      }
    },
  };
});
