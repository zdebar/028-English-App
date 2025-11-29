import { create } from "zustand";

type TourState = {
  showTour: boolean;
  currentId: number | string | undefined | null;
  lastId: number | string | undefined | null;
  setCurrentId: (idx: number | string | undefined | null) => void;
  openTour: () => void;
  closeTour: () => void;
};

export const useTourStore = create<TourState>((set) => ({
  showTour: false,
  currentId: null,
  lastId: null,
  setCurrentId: (idx) =>
    set((state) => ({
      lastId: state.currentId,
      currentId: idx,
    })),
  openTour: () => set({ showTour: true }),
  closeTour: () => set({ showTour: false, currentId: null, lastId: null }),
}));
