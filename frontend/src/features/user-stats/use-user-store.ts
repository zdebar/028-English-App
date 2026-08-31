import { create } from 'zustand';
import type { LevelOverviewType } from '@/types/generic.types';

interface UserState {
  levels: LevelOverviewType[];
  levelsLoading: boolean;
  levelsError: Error | null;
  dailyProgressChange: number;
  dailyProgressChangeLoading: boolean;
  dailyProgressChangeError: Error | null;
  clearLevels: () => void;
  clearDailyProgressChange: () => void;
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
    dailyProgressChange: initialDailyStats,
    dailyProgressChangeLoading: false,
    dailyProgressChangeError: null,
    clearLevels: () => {
      set({ levels: initialLevels, levelsLoading: false, levelsError: null });
    },
    clearDailyProgressChange: () => {
      set({
        dailyProgressChange: initialDailyStats,
        dailyProgressChangeLoading: false,
        dailyProgressChangeError: null,
      });
    },
  };
  return store;
});
