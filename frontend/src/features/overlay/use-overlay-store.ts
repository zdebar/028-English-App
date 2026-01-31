import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface OverlayState {
  isOverlayOpen: boolean;
  openOverlay: (onCloseOverlayCallback?: () => void) => void;
  closeOverlay: () => void;
}

/**
 * A Zustand store hook for managing overlay state in the application.
 *
 * This hook provides state and actions to control the visibility of an overlay,
 * including an optional callback that can be executed when the overlay is closed.
 *
 * @property {boolean} isOverlayOpen - Indicates whether the overlay is currently open.
 * @property {(onCloseOverlayCallback?: () => void) => void} openOverlay - Function to open the overlay with an optional close callback.
 * @property {() => void} closeOverlay - Function to close the overlay and execute the close callback if provided.
 */
export const useOverlayStore = create<OverlayState>()(
  devtools(
    (set) => {
      let onCloseOverlayCallback: (() => void) | undefined = undefined;

      return {
        isOverlayOpen: false,
        openOverlay: (callback) => {
          onCloseOverlayCallback = callback;
          set({ isOverlayOpen: true });
        },
        closeOverlay: () => {
          set({ isOverlayOpen: false });
          if (onCloseOverlayCallback) {
            onCloseOverlayCallback();
            onCloseOverlayCallback = undefined;
          }
        },
      };
    },
    { name: 'OverlayStore' },
  ),
);
