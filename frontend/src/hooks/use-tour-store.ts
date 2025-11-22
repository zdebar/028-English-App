import { create } from "zustand";
import { type TourStep } from "./use-tour-guide";

type TourState = {
  showTour: boolean;
  current: TourStep | null;
  lastTarget: string | null;
  setCurrent: (step: TourStep | null) => void;
  openTour: () => void;
  closeTour: () => void;
};

export const useTourStore = create<TourState>((set) => ({
  showTour: false,
  current: null,
  lastTarget: null,
  setCurrent: (step) =>
    set((state) => ({
      lastTarget: state.current?.target ?? null,
      current: step,
    })),
  openTour: () => set({ showTour: true }),
  closeTour: () => set({ showTour: false, current: null }),
}));
