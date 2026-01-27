import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { TEXTS } from '@/config/texts';
import { createPortal } from 'react-dom';
import ButtonRectangular from '../../components/UI/buttons/ButtonRectangular';

interface ModalProps {
  onConfirm: () => void;
  title: string;
  description: string;
}

/**
 * Modal component for confirmation dialogs.
 *
 * @param onConfirm Function to call when confirming the action.
 * @param onClose Function to call when closing the modal.
 * @param title Title of the modal dialog.
 * @param description Description text in the modal dialog.
 */
export function Modal({ onConfirm, title, description }: ModalProps) {
  const closeOverlay = useOverlayStore((state) => state.closeOverlay);

  const modalRoot = document.getElementById('root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-1001 flex min-h-40 items-center justify-center">
      <div className="card-width pointer-events-auto flex flex-col justify-between">
        <div className="color-base flex grow flex-col items-center gap-2 p-4 text-center">
          <p className="font-bold">{title}</p>
          <p>{description}</p>
        </div>
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
