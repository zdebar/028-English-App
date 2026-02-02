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
 * Overlay graphically covers the entire viewport, stops propagation of pointer events to underlying elements,
 * and blocks keyboard events where such behavior is set up (e.g., CloseButton with the Escape key).
 *
 * @returns An object containing:
 *  - isOverlayOpen - Indicates whether the overlay is currently open.
 *  - openOverlay - Function to open the overlay with an optional close callback.
 *  - closeOverlay - Function to close the overlay and execute the close callback if provided.
 */
export const useOverlayStore = create<OverlayState>()(
  devtools(
    (set, get) => {
      let onCloseOverlayCallback: (() => void) | undefined = undefined;

      return {
        isOverlayOpen: false,
        openOverlay: (callback) => {
          onCloseOverlayCallback = callback;
          set({ isOverlayOpen: true });
        },
        closeOverlay: () => {
          if (!get().isOverlayOpen) return;
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
