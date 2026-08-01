import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface OverlayState {
  isOverlayOpen: boolean;
  isOverlayDismissible: boolean;
  openOverlay: (onCloseOverlayCallback?: () => void) => void;
  setOverlayDismissible: (isDismissible: boolean) => void;
  dismissOverlay: () => void;
  closeOverlay: () => void;
}

type OverlayCloseCallback = (() => void) | undefined;

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
 *  - dismissOverlay - User-initiated close that is ignored while dismissal is locked.
 *  - closeOverlay - Function to close the overlay and execute the close callback if callback was provided with openOverlay.
 */
export const useOverlayStore = create<OverlayState>()(
  devtools(
    (set, get) => {
      let onCloseOverlayCallback: OverlayCloseCallback = undefined;

      return {
        isOverlayOpen: false,
        isOverlayDismissible: true,
        openOverlay: (closeCallback) => {
          onCloseOverlayCallback = closeCallback;
          set({ isOverlayOpen: true, isOverlayDismissible: true });
        },
        setOverlayDismissible: (isDismissible) => {
          set({ isOverlayDismissible: isDismissible });
        },
        dismissOverlay: () => {
          if (!get().isOverlayDismissible) return;
          get().closeOverlay();
        },
        closeOverlay: () => {
          if (!get().isOverlayOpen) return;

          set({ isOverlayOpen: false, isOverlayDismissible: true });

          const closeCallback = onCloseOverlayCallback;
          onCloseOverlayCallback = undefined;
          closeCallback?.();
        },
      };
    },
    { name: 'OverlayStore' },
  ),
);
