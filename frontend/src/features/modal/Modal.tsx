import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import StyledButton from '../../components/UI/buttons/StyledButton';

type ModalProps = Readonly<{
  /** Called when the confirm button is pressed; errors are not caught by Modal. */
  onConfirm: () => void | Promise<void>;
  /** Registered with the overlay store so Escape/outside overlay close can dismiss the owner. */
  onClose: () => void;
  /** Dialog body rendered above the cancel and confirm buttons. */
  children?: ReactNode;
  /** Cancel action content; defaults to the shared cancel text. */
  cancelLabel?: ReactNode;
  /** Confirm action content; defaults to the shared confirm text. */
  confirmLabel?: ReactNode;
  /** Direction used to lay out the action buttons. */
  actionsLayout?: 'horizontal' | 'vertical';
}>;

export function Modal({
  onConfirm,
  onClose,
  children,
  cancelLabel = TEXTS.cancel,
  confirmLabel = TEXTS.confirm,
  actionsLayout = 'horizontal',
}: ModalProps): JSX.Element | null {
  const closeOverlay = useOverlayStore((state) => state.closeOverlay);
  const openOverlay = useOverlayStore((state) => state.openOverlay);
  const setOverlayDismissible = useOverlayStore((state) => state.setOverlayDismissible);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleCancel = useCallback(() => {
    if (isSubmittingRef.current) return;
    closeOverlay();
  }, [closeOverlay]);

  const handleConfirm = useCallback(async () => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setOverlayDismissible(false);
    try {
      await onConfirm();
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      closeOverlay();
    }
  }, [closeOverlay, onConfirm, setOverlayDismissible]);

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
        <div className={`flex gap-1 ${actionsLayout === 'vertical' ? 'flex-col' : ''}`}>
          <StyledButton onClick={handleCancel} disabled={isSubmitting} className="h-button font-bold">
            {cancelLabel}
          </StyledButton>
          <StyledButton onClick={handleConfirm} disabled={isSubmitting} className="h-button font-bold">
            {confirmLabel}
          </StyledButton>
        </div>
      </div>
    </div>,
    modalRoot,
  );
}
