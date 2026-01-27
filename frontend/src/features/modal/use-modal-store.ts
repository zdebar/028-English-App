import { create } from 'zustand';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { devtools } from 'zustand/middleware';

interface ModalState {
  isModalOpened: boolean;
  openModal: () => void;
}

/**
 * Zustand store for managing overlay open/close state.
 */
export const useModalStore = create<ModalState>()(
  devtools(
    (set) => ({
      isModalOpened: false,
      openModal: () => {
        set({ isModalOpened: true });
        useOverlayStore.getState().openOverlay(() => set({ isModalOpened: false }));
      },
    }),
    { name: 'ModalStore' },
  ),
);
