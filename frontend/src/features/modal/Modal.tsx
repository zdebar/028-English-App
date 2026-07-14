import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect, useState, type JSX, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import StyledButton from '../../components/UI/buttons/StyledButton';

type ModalProps = Readonly<{
  /** Called when the confirm button is pressed; errors are not caught by Modal. */
  onConfirm: () => void | Promise<void>;
  /** Registered with the overlay store so Escape/outside overlay close can dismiss the owner. */
  onClose: () => void;
  /** Dialog body rendered above the cancel and confirm buttons. */
  children?: ReactNode;
}>;

export function Modal({ onConfirm, onClose, children }: ModalProps): JSX.Element | null {
  const closeOverlay = useOverlayStore((state) => state.closeOverlay);
  const openOverlay = useOverlayStore((state) => state.openOverlay);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = useCallback(() => {
    if (isSubmitting) return;
    closeOverlay();
  }, [closeOverlay, isSubmitting]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
      closeOverlay();
    }
  }, [closeOverlay, isSubmitting, onConfirm]);

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
          <StyledButton onClick={handleCancel} disabled={isSubmitting} className="h-button font-bold">
            {TEXTS.cancel}
          </StyledButton>
          <StyledButton onClick={handleConfirm} disabled={isSubmitting} className="h-button font-bold">
            {TEXTS.confirm}
          </StyledButton>
        </div>
      </div>
    </div>,
    modalRoot,
  );
}
