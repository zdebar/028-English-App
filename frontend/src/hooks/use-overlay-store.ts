import { create } from 'zustand';

interface OverlayState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true}),
  close: () => set({ isOpen: false}),
}));