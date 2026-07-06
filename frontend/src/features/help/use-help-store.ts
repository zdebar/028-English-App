import { create } from 'zustand';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { devtools } from 'zustand/middleware';

interface HelpState {
  isHelpOpened: boolean;
  openHelp: () => void;
  closeHelp: () => void;
}

/**
 * Stores help overlay visibility and coordinates it with the shared overlay mask.
 *
 * @returns Zustand hook exposing isHelpOpened plus openHelp and closeHelp actions.
 * openHelp also registers an overlay close callback that clears the help state.
 */
export const useHelpStore = create<HelpState>()(
  devtools(
    (set) => ({
      isHelpOpened: false,
      openHelp: () => {
        set({ isHelpOpened: true });
        useOverlayStore.getState().openOverlay(() => {
          set({ isHelpOpened: false });
        });
      },
      closeHelp: () => {
        set({ isHelpOpened: false });
      },
    }),
    { name: 'HelpStore' },
  ),
);
