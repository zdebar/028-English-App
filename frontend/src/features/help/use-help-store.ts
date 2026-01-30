import { create } from 'zustand';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { devtools } from 'zustand/middleware';

interface HelpState {
  isHelpOpened: boolean;
  openHelp: () => void;
}

/**
 * A Zustand store hook for managing the help feature state in the application.
 *
 * @property {boolean} isHelpOpened - Indicates whether the help section is currently open.
 * @property {() => void} openHelp - Opens the help section and sets up an overlay to close it on interaction.
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
