import { create } from 'zustand';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';

interface HelpState {
  isHelpOpened: boolean;
  openHelp: () => void;
  closeHelp: () => void;
}

/**
 * Zustand store for managing overlay open/close state.
 */
export const useHelpStore = create<HelpState>((set) => ({
  isHelpOpened: false,
  openHelp: () => {
    set({ isHelpOpened: true });
    useOverlayStore.getState().open();
  },
  closeHelp: () => {
    set({ isHelpOpened: false });
    useOverlayStore.getState().close();
  },
}));
