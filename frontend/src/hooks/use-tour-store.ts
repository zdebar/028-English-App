import { create } from "zustand";

type TourState = {
  showTour: boolean;
  currentId: number | null;
  lastId: number | null;
  setCurrentId: (idx: number) => void;
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
