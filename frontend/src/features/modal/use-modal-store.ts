import { create } from 'zustand';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { devtools } from 'zustand/middleware';

interface ModalState {
  isModalOpened: boolean;
  openModal: () => void;
}

/**
 * A Zustand store for managing modal state in the application.
 *
 * This store provides state and actions to control the visibility of a modal.
 * It integrates with an overlay store to handle modal dismissal on overlay interaction.
 *
 * @property {boolean} isModalOpened - Indicates whether the modal is currently open.
 * @property {() => void} openModal - Opens the modal and sets up an overlay to close it on interaction.
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
