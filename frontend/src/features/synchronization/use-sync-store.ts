import { create } from 'zustand';

interface SyncState {
  isSynchronized: boolean;
  isSynchronizing: boolean;
  isSyncError: boolean;
  resetSyncState: () => void;
  setSynchronized: (value: boolean) => void;
  setSynchronizing: (value: boolean) => void;
  setSyncError: (value: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSynchronized: false,
  isSynchronizing: false,
  isSyncError: false,
  resetSyncState: () =>
    set({ isSynchronized: false, isSynchronizing: false, isSyncError: false }),
  setSynchronized: (value: boolean) => set({ isSynchronized: value }),
  setSynchronizing: (value: boolean) => set({ isSynchronizing: value }),
  setSyncError: (value: boolean) => set({ isSyncError: value }),
}));
