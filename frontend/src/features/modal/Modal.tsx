import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect, type JSX, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import BaseButton from '../../components/UI/buttons/BaseButton';

type ModalProps = Readonly<{
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: ReactNode;
}>;

/**
 * Modal component for confirmation dialogs.
 * Renders a modal with children as content, and confirm/cancel buttons.
 * Opens Overlay on mount and closes it on unmount.
 *
 * @param onConfirm Function to call when confirming the action. Component does not handle any errors thrown by this function.
 * @param onClose Function to call when closing the modal.
 * @param children Optional children elements to render inside the modal.
 * @return The Modal component rendered in a portal.
 */
export function Modal({ onConfirm, onClose, children }: ModalProps): JSX.Element | null {
  const closeOverlay = useOverlayStore((state) => state.closeOverlay);
  const openOverlay = useOverlayStore((state) => state.openOverlay);

  const handleCancel = useCallback(() => {
    closeOverlay();
  }, [closeOverlay]);

  const handleConfirm = useCallback(() => {
    void onConfirm();
    closeOverlay();
  }, [closeOverlay, onConfirm]);

  const modalRoot = document.getElementById('root');

  useEffect(() => {
    openOverlay(onClose);
  }, [onClose, openOverlay]);

  if (!modalRoot) {
    return null;
  }

  return createPortal(
    <div className="z-modal pointer-events-none fixed inset-0 flex items-center justify-center">
      <div className="card-width color-base pointer-events-auto gap-1 pt-4">
        <div className="flex grow flex-col items-center gap-2 p-6 text-center">{children}</div>
        <div className="flex gap-1">
          <BaseButton onClick={handleCancel} className="h-button font-bold">
            {TEXTS.cancel}
          </BaseButton>
          <BaseButton onClick={handleConfirm} className="h-button font-bold">
            {TEXTS.confirm}
          </BaseButton>
        </div>
      </div>
    </div>,
    modalRoot,
  );
}
