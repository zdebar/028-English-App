import { create } from 'zustand';
import type { LevelOverviewType } from '@/types/generic.types';

interface UserState {
  levels: LevelOverviewType[];
  levelsLoading: boolean;
  levelsError: Error | null;
  startedTodayCount: number;
  clearLevels: () => void;
}

const initialLevels: LevelOverviewType[] = [];
const initialStartedTodayCount = 0;

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
    startedTodayCount: initialStartedTodayCount,
    clearLevels: () => {
      set({
        levels: initialLevels,
        levelsLoading: false,
        levelsError: null,
        startedTodayCount: initialStartedTodayCount,
      });
    },
  };
  return store;
});
