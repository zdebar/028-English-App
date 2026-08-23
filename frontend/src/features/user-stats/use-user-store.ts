import { create } from 'zustand';
import type { LevelOverviewType } from '@/types/generic.types';

interface UserState {
  levels: LevelOverviewType[];
  levelsLoading: boolean;
  levelsError: Error | null;
  dailyStarCount: number;
  dailyStarCountLoading: boolean;
  dailyStarCountError: Error | null;
  clearLevels: () => void;
  clearDailyStarCount: () => void;
}

const initialLevels: LevelOverviewType[] = [];
const initialDailyStats = 0;

/**
 * Stores user dashboard progress snapshots populated by the active Dexie subscriptions.
 *
 * @returns Zustand hook with level overview, daily count, loading/error flags, and clear actions.
 */
export const useUserStore = create<UserState>((set) => {
  const store: UserState = {
    levels: initialLevels,
    levelsLoading: true,
    levelsError: null,
    dailyStarCount: initialDailyStats,
    dailyStarCountLoading: false,
    dailyStarCountError: null,
    clearLevels: () => {
      set({ levels: initialLevels, levelsLoading: false, levelsError: null });
    },
    clearDailyStarCount: () => {
      set({
        dailyStarCount: initialDailyStats,
        dailyStarCountLoading: false,
        dailyStarCountError: null,
      });
    },
  };
  return store;
});
