import { create } from 'zustand';
import type { LevelOverviewType } from '@/types/generic.types';

interface UserState {
  levels: LevelOverviewType[];
  levelsLoading: boolean;
  levelsError: Error | null;
  dailyCount: number;
  dailyCountLoading: boolean;
  dailyCountError: Error | null;
  showMasteredDashboard: boolean;
  setMasteredDashboard: (value: boolean) => void;
  clearLevels: () => void;
  clearDailyCount: () => void;
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
    dailyCount: initialDailyStats,
    dailyCountLoading: false,
    dailyCountError: null,
    showMasteredDashboard: false,
    setMasteredDashboard: (value: boolean) => {
      set({ showMasteredDashboard: value });
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
