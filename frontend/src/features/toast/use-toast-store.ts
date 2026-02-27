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
 * @returns {ToastState}
 *  - message - The current toast message.
 *  - type - The type of the toast ('success', 'error', 'info').
 *  - visible - Indicates whether the toast is currently visible.
 *  - showToast - Function to display a toast with a given message and optional type.
 *  - hideToast - Function to hide the currently displayed toast.
 */
export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  timeoutId: null,
  showToast: (message, type = 'info') => {
    set((state) => {
      if (state.timeoutId !== null) {
        clearTimeout(state.timeoutId);
      }

      const timeoutId = window.setTimeout(() => {
        set({ visible: false, timeoutId: null });
      }, config.toast.duration);

      return { message, type, visible: true, timeoutId };
    });
  },
  hideToast: () =>
    set((state) => {
      if (state.timeoutId !== null) {
        clearTimeout(state.timeoutId);
      }

      return { visible: false, timeoutId: null };
    }),
}));
