import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, type JSX } from 'react';
import { createPortal } from 'react-dom';
import ButtonRectangular from '../../components/UI/buttons/ButtonRectangular';

interface ModalProps {
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * Modal component for confirmation dialogs.
 * Renders a modal with title, description, overlay and confirm/cancel buttons.
 *
 * @param onConfirm Function to call when confirming the action. Component does not handle any errors thrown by this function.
 * @param onClose Function to call when closing the modal.
 * @param children Optional children elements to render inside the modal.
 * @return The Modal component rendered in a portal.
 */
export function Modal({ onConfirm, onClose, children }: ModalProps): JSX.Element | null {
  const closeOverlay = useOverlayStore((state) => state.closeOverlay);
  const openOverlay = useOverlayStore((state) => state.openOverlay);

  const modalRoot = document.getElementById('root');
  if (!modalRoot) return null;

  useEffect(() => {
    openOverlay(onClose);
  }, [onClose, openOverlay]);

  return createPortal(
    <div className="z-modal pointer-events-none fixed inset-0 flex items-center justify-center">
      <div className="card-width color-base pointer-events-auto flex flex-col justify-between pt-2">
        <div className="flex grow flex-col items-center gap-2 p-6 text-center">{children}</div>
        <div className="flex gap-1">
          <ButtonRectangular
            onClick={() => {
              closeOverlay();
            }}
          >
            {TEXTS.cancel}
          </ButtonRectangular>
          <ButtonRectangular
            onClick={() => {
              onConfirm();
              closeOverlay();
            }}
          >
            {TEXTS.confirm}
          </ButtonRectangular>
        </div>
      </div>
    </div>,
    modalRoot,
  );
}
