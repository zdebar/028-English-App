import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface OverlayState {
  isOverlayOpen: boolean;
  onCloseOverlayCallback?: () => void;
  openOverlay: (onCloseOverlayCallback?: () => void) => void;
  closeOverlay: () => void;
}

/**
 * A Zustand store hook for managing overlay state in the application.
 *
 * This hook provides state and actions to control the visibility of an overlay,
 * including an optional callback that can be executed when the overlay is closed.
 *
 * @returns An object containing:
 * - `isOverlayOpen`: A boolean indicating whether the overlay is currently open.
 * - `onCloseOverlayCallback`: An optional callback function to be executed when the overlay is closed.
 * - `openOverlay`: A function to open the overlay, accepting an optional callback to run on close.
 * - `closeOverlay`: A function to close the overlay, executing the callback if provided.
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
