import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { createPortal } from 'react-dom';
import ButtonRectangular from '../../components/UI/buttons/ButtonRectangular';

interface ModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
}

/**
 * Modal component for confirmation dialogs.
 *
 * @param title Title of the modal dialog.
 * @param description Description text in the modal dialog.
 * @param onConfirm Function to call when confirming the action.
 * @return {JSX.Element | null} The Modal component rendered in a portal.
 */
export function Modal({ onConfirm, title, description }: ModalProps): JSX.Element | null {
  const closeOverlay = useOverlayStore((state) => state.closeOverlay);

  const modalRoot = document.getElementById('root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="z-modal pointer-events-none fixed inset-0 flex items-center justify-center">
      <div className="card-width color-base pointer-events-auto flex flex-col justify-between pt-2 pb-1">
        <div className="flex grow flex-col items-center gap-2 p-6 text-center">
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
