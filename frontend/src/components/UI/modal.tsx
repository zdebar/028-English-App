import OverlayMask from '@/components/UI/OverlayMask';
import { TEXTS } from '@/config/texts';
import { createPortal } from 'react-dom';
import ButtonRectangular from './buttons/ButtonRectangular';

interface ModalProps {
  showModal: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  description: string;
}

/**
 * Modal component for confirmation dialogs.
 *
 * @param showModal Whether the modal is visible.
 * @param onConfirm Function to call when confirming the action.
 * @param onClose Function to call when closing the modal.
 * @param title Title of the modal dialog.
 * @param description Description text in the modal dialog.
 */
export function Modal({ showModal, onConfirm, onClose, title, description }: ModalProps) {
  if (!showModal) {
    return null;
  }

  const modalRoot = document.getElementById('root');
  if (!modalRoot) return null;

  return createPortal(
    <>
      <OverlayMask onClose={onClose} />
      <div className="pointer-events-none fixed inset-0 z-1001 flex min-h-40 items-center justify-center">
        <div className="card-width pointer-events-auto flex flex-col justify-between">
          <div className="color-base flex grow flex-col items-center gap-2 p-4 text-center">
            <p className="font-bold">{title}</p>
            <p>{description}</p>
          </div>
          <div className="flex gap-1">
            <ButtonRectangular onClick={onClose}>{TEXTS.cancel}</ButtonRectangular>
            <ButtonRectangular onClick={onConfirm}>{TEXTS.confirm}</ButtonRectangular>
          </div>
        </div>
      </div>
    </>,
    modalRoot,
  );
}
