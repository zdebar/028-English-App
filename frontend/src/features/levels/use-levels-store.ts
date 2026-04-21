import { create } from 'zustand';

interface LevelsStoreState {
  showMastered: boolean;
  setShowMastered: (show: boolean) => void;
  unpackedIndex: number | null;
  setUnpackedIndex: (index: number | null) => void;
}

export const useLevelsStore = create<LevelsStoreState>((set) => ({
  showMastered: false,
  setShowMastered: (show) => set({ showMastered: show }),
  unpackedIndex: null,
  setUnpackedIndex: (index) => set({ unpackedIndex: index }),
}));
