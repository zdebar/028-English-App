import { create } from 'zustand';

interface SyncState {
  isSynchronized: boolean;
  isSynchronizing: boolean;
  isSyncError: boolean;
  syncRevision: number;
  resetSyncState: () => void;
  setSynchronized: (value: boolean) => void;
  setSynchronizing: (value: boolean) => void;
  setSyncError: (value: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSynchronized: false,
  isSynchronizing: false,
  isSyncError: false,
  syncRevision: 0,
  resetSyncState: () =>
    set({ isSynchronized: false, isSynchronizing: false, isSyncError: false, syncRevision: 0 }),
  setSynchronized: (value: boolean) =>
    set((state) => ({
      isSynchronized: value,
      syncRevision: value ? state.syncRevision + 1 : state.syncRevision,
    })),
  setSynchronizing: (value: boolean) => set({ isSynchronizing: value }),
  setSyncError: (value: boolean) => set({ isSyncError: value }),
}));
