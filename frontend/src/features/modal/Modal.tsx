import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { reportError } from '@/features/logging/logging-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import StyledButton from '../../components/UI/buttons/StyledButton';

type ModalProps = Readonly<{
  /** Confirmation action. Rejections are logged and shown as a generic failure. */
  onConfirm: () => void | Promise<void>;
  /** Registered with the overlay store so Escape/outside overlay close can dismiss the owner. */
  onClose: () => void;
  /** Accessible name for the dialog. */
  ariaLabel: string;
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
  ariaLabel,
  children,
  cancelLabel = TEXTS.cancel,
  confirmLabel = TEXTS.confirm,
  actionsLayout = 'horizontal',
}: ModalProps): JSX.Element | null {
  const closeOverlay = useOverlayStore((state) => state.closeOverlay);
  const openOverlay = useOverlayStore((state) => state.openOverlay);
  const setOverlayDismissible = useOverlayStore((state) => state.setOverlayDismissible);
  const showToast = useToastStore((state) => state.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const handleCancel = useCallback(() => {
    if (isSubmittingRef.current) return;
    closeOverlay();
  }, [closeOverlay]);

  const handleConfirm = useCallback(async () => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setOverlayDismissible(false);
    let succeeded = false;

    try {
      await onConfirm();
      succeeded = true;
    } catch (error) {
      reportError('Modal confirmation failed', error);
      showToast(TEXTS.genericFailure, 'error');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setOverlayDismissible(true);
    }

    if (succeeded) closeOverlay();
  }, [closeOverlay, onConfirm, setOverlayDismissible, showToast]);

  const handleDialogKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, []);

  const modalRoot = document.getElementById('root');

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    openOverlay(() => onCloseRef.current());
  }, [openOverlay]);

  useEffect(() => {
    const activeElement = document.activeElement;
    previouslyFocusedElementRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();

    return () => {
      const previouslyFocusedElement = previouslyFocusedElementRef.current;
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (isSubmitting) dialogRef.current?.focus();
  }, [isSubmitting]);

  if (!modalRoot) {
    return null;
  }

  return createPortal(
    <div className="z-modal min-[800px]:items:start pointer-events-none fixed inset-0 flex items-center justify-center min-[800px]:pt-[calc(50vh-12rem)]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-busy={isSubmitting}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="card-width color-base pointer-events-auto gap-1 pt-4"
      >
        <div className="flex grow flex-col items-center gap-2 p-6 text-center">{children}</div>
        <div className={`flex gap-1 ${actionsLayout === 'vertical' ? 'flex-col' : ''}`}>
          <StyledButton
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-button font-bold"
          >
            {cancelLabel}
          </StyledButton>
          <StyledButton
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="h-button font-bold"
          >
            {confirmLabel}
          </StyledButton>
        </div>
      </div>
    </div>,
    modalRoot,
  );
}
