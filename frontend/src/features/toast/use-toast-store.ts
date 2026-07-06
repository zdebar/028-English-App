import { create } from 'zustand';
import config from '@/config/config';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  showToast: (message: string, type?: ToastType, loading?: boolean) => void;
  hideToast: () => void;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

/**
 * Stores one auto-hiding toast notification.
 *
 * @returns Zustand hook exposing the current toast state plus showToast and hideToast actions.
 * showToast replaces any existing timeout; loading toasts stay visible until replaced or hidden.
 */
export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  timeoutId: null,
  showToast: (message, type = 'info', loading = false) => {
    set((state) => {
      if (state.timeoutId !== null) {
        clearTimeout(state.timeoutId);
      }

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      if (!loading) {
        timeoutId = globalThis.setTimeout(() => {
          set({ visible: false, timeoutId: null });
        }, config.toast.duration);
      }

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
