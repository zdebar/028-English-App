import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncWarningState {
  isSynchronized: boolean;
  setSynchronized: (value: boolean) => void;
}

export const useSyncWarningStore = create<SyncWarningState>()(
  persist(
    (set) => ({
      isSynchronized: true,
      setSynchronized: (value: boolean) => set({ isSynchronized: value }),
    }),
    {
      name: 'sync-warning', // localStorage key
    },
  ),
);
