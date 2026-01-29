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
 * @returns An object with the following properties:
 * - `isHelpOpened`: A boolean indicating driving visibility of HelpTexts.
 * - `openHelp`: Sets isHelpOpened to true and opens the overlay.
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
