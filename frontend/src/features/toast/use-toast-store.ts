import { create } from 'zustand';
import config from '@/config/config';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  timeoutId: number | null;
}

/**
 * Zustand store to manage toast notifications in the application.
 *
 * @returns An object containing:
 * - `message`: The current toast message.
 * - `type`: The type of the toast ('success', 'error', 'info').
 * - `visible`: A boolean indicating whether the toast is currently visible.
 * - `showToast`: A function to display a toast with a given message and optional type.
 * - `hideToast`: A function to hide the currently displayed toast.
 */
export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  timeoutId: null,
  showToast: (message, type = 'info') => {
    set((state) => {
      // Clear any existing timeout
      if (state.timeoutId !== null) {
        clearTimeout(state.timeoutId);
      }

      // Set a new timeout
      const timeoutId = window.setTimeout(() => {
        set((current) => ({
          ...current,
          visible: false,
          timeoutId: null,
        }));
      }, config.toast.duration);

      // Update the toast state
      return {
        ...state,
        message,
        type,
        visible: true,
        timeoutId,
      };
    });
  },
  hideToast: () =>
    set((state) => {
      // Clear any existing timeout
      if (state.timeoutId !== null) {
        clearTimeout(state.timeoutId);
      }

      // Hide the toast
      return {
        ...state,
        visible: false,
        timeoutId: null,
      };
    }),
}));
