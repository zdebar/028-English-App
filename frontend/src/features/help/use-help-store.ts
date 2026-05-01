import { create } from 'zustand';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { devtools } from 'zustand/middleware';

interface HelpState {
  isHelpOpened: boolean;
  openHelp: () => void;
  closeHelp: () => void;
}

/**
 * A Zustand store for managing the help overlay state.
 *
 * @returns {HelpState}
 * - `isHelpOpened: boolean` - whether the help overlay is visible
 * - `openHelp(): void` - opens the help overlay and registers a close callback
 * - `closeHelp(): void` - closes the help overlay
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
