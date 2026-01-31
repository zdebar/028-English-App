import { create } from 'zustand';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { devtools } from 'zustand/middleware';

interface HelpState {
  isHelpOpened: boolean;
  openHelp: () => void;
}

/**
 * A Zustand store for managing the help overlay state.
 *
 * @returns {HelpState}
 * - `isHelpOpened: boolean` - whether the help overlay is visible
 * - `openHelp(): void` - opens the help overlay and registers a close callback
 */
export const useHelpStore = create<HelpState>()(
  devtools(
    (set) => ({
      isHelpOpened: false,
      openHelp: () => {
        set({ isHelpOpened: true });
        useOverlayStore.getState().openOverlay(() => set({ isHelpOpened: false }));
      },
    }),
    { name: 'HelpStore' },
  ),
);
