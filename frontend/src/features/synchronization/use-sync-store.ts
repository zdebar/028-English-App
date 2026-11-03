import { create } from 'zustand';

interface SyncState {
  isSynchronized: boolean;
  isSynchronizing: boolean;
  isSyncError: boolean;
  failedTasks: readonly string[];
  nextRetryAt: number | null;
  resetSyncState: () => void;
  setSynchronized: (value: boolean) => void;
  setSynchronizing: (value: boolean) => void;
  setSyncError: (value: boolean) => void;
  setSyncDetails: (failedTasks: readonly string[], nextRetryAt: number | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSynchronized: false,
  isSynchronizing: false,
  isSyncError: false,
  failedTasks: [],
  nextRetryAt: null,
  resetSyncState: () =>
    set({
      isSynchronized: false,
      isSynchronizing: false,
      isSyncError: false,
      failedTasks: [],
      nextRetryAt: null,
    }),
  setSynchronized: (value: boolean) => set({ isSynchronized: value }),
  setSynchronizing: (value: boolean) => set({ isSynchronizing: value }),
  setSyncError: (value: boolean) => set({ isSyncError: value }),
  setSyncDetails: (failedTasks: readonly string[], nextRetryAt: number | null) =>
    set({ failedTasks, nextRetryAt }),
}));
