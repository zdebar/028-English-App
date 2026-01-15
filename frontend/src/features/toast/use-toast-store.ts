import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  timeoutId: number | null;
}

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
        set((current) => ({
          ...current,
          visible: false,
          timeoutId: null,
        }));
      }, 3000);
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
      if (state.timeoutId !== null) {
        clearTimeout(state.timeoutId);
      }
      return {
        ...state,
        visible: false,
        timeoutId: null,
      };
    }),
}));
