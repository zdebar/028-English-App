import { create } from 'zustand';

interface HelpState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Zustand store for managing overlay open/close state.
 */
export const useHelpStore = create<HelpState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
