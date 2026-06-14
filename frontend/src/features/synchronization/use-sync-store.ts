import { create } from 'zustand';

interface SyncState {
  isSynchronized: boolean;
  isSynchronizing: boolean;
  resetSyncState: () => void;
  setSynchronized: (value: boolean) => void;
  setSynchronizing: (value: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSynchronized: false,
  isSynchronizing: false,
  resetSyncState: () => set({ isSynchronized: false, isSynchronizing: false }),
  setSynchronized: (value: boolean) => set({ isSynchronized: value }),
  setSynchronizing: (value: boolean) => set({ isSynchronizing: value }),
}));
