import { create } from 'zustand';
import type { LevelOverviewType } from '@/types/generic.types';

interface UserState {
  levels: LevelOverviewType[];
  levelsLoading: boolean;
  levelsError: Error | null;
  clearLevels: () => void;
}

const initialLevels: LevelOverviewType[] = [];

/**
 * Stores user dashboard progress snapshots populated by the active Dexie subscriptions.
 *
 * @returns Zustand hook with level overview, loading/error flags, and clear actions.
 */
export const useUserStore = create<UserState>((set) => {
  const store: UserState = {
    levels: initialLevels,
    levelsLoading: true,
    levelsError: null,
    clearLevels: () => {
      set({
        levels: initialLevels,
        levelsLoading: false,
        levelsError: null,
      });
    },
  };
  return store;
});
