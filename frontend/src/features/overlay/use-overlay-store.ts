import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface OverlayState {
  isOverlayOpen: boolean;
  onCloseOverlayCallback?: () => void;
  openOverlay: (onCloseOverlayCallback?: () => void) => void;
  closeOverlay: () => void;
}

/**
 * Zustand store for managing overlay open/close state.
 */
export const useOverlayStore = create<OverlayState>()(
  devtools(
    (set, get) => ({
      isOverlayOpen: false,
      onCloseOverlayCallback: undefined,
      openOverlay: (onCloseOverlayCallback) => set({ isOverlayOpen: true, onCloseOverlayCallback }),
      closeOverlay: () => {
        const cb = get().onCloseOverlayCallback;
        set({ isOverlayOpen: false, onCloseOverlayCallback: undefined });
        if (cb) cb();
      },
    }),
    { name: 'OverlayStore' },
  ),
);
