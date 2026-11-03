import { create } from 'zustand';
import config from '@/config/config';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

/**
 * Stores one auto-hiding toast notification.
 *
 * @returns Zustand hook exposing the current toast state plus showToast and hideToast actions.
 * showToast replaces any existing toast and its timeout.
 */
export const useToastStore = create<ToastState>((set) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const clearToastTimeout = () => {
    if (timeoutId === null) return;
    globalThis.clearTimeout(timeoutId);
    timeoutId = null;
  };

  return {
    message: '',
    type: 'info',
    visible: false,
    showToast: (message, type = 'info') => {
      clearToastTimeout();
      set({ message, type, visible: true });
      timeoutId = globalThis.setTimeout(() => {
        timeoutId = null;
        set({ visible: false });
      }, config.toast.duration);
    },
    hideToast: () => {
      clearToastTimeout();
      set({ visible: false });
    },
  };
});
