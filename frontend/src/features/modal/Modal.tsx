import { reportError } from '@/features/logging/logging-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import StyledButton from '../../components/UI/buttons/StyledButton';

type ModalProps = Readonly<{
  /** Confirmation action. Rejections are logged and shown as a generic failure. */
  onConfirm: () => void | Promise<void>;
  /** Called when the user cancels or a confirmation succeeds. */
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
}: ModalProps): JSX.Element {
  const showToast = useToastStore((state) => state.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const hasRequestedCloseRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const requestClose = useCallback(() => {
    if (isSubmittingRef.current || hasRequestedCloseRef.current) return;

    hasRequestedCloseRef.current = true;
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    onClose();
  }, [onClose]);
  const requestCloseRef = useRef(requestClose);

  useEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose]);

  useEffect(() => {
    if (!isSubmitting) isSubmittingRef.current = false;
  }, [isSubmitting]);

  const handleConfirm = useCallback(async () => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    let succeeded = false;

    try {
      await onConfirm();
      succeeded = true;
    } catch (error) {
      reportError('Modal confirmation failed', error);
      showToast(TEXTS.genericFailure, 'error');
    } finally {
      setIsSubmitting(false);
    }

    if (succeeded) {
      isSubmittingRef.current = false;
      requestClose();
    }
  }, [onConfirm, requestClose, showToast]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      requestCloseRef.current();
    };
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      // Keep global Escape handlers from dismissing an independent overlay beneath the modal.
      if (event.key === 'Escape') event.stopPropagation();
    };
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;

      const { bottom, left, right, top } = dialog.getBoundingClientRect();
      const clickedInsideDialog =
        event.clientX >= left &&
        event.clientX <= right &&
        event.clientY >= top &&
        event.clientY <= bottom;

      if (!clickedInsideDialog) requestCloseRef.current();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('keydown', handleDialogKeyDown);
    dialog.addEventListener('click', handleBackdropClick);

    dialog.showModal();

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('keydown', handleDialogKeyDown);
      dialog.removeEventListener('click', handleBackdropClick);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={ariaLabel}
      aria-busy={isSubmitting}
      className="modal-dialog card-width color-base gap-1 border-0 p-0 pt-4"
    >
      <div className="flex grow flex-col items-center gap-2 p-6 text-center">{children}</div>
      <div className={`flex gap-1 ${actionsLayout === 'vertical' ? 'flex-col' : ''}`}>
        <StyledButton
          onClick={requestClose}
          aria-disabled={isSubmitting}
          autoFocus
          className="h-button font-bold"
        >
          {cancelLabel}
        </StyledButton>
        <StyledButton
          onClick={handleConfirm}
          aria-disabled={isSubmitting}
          className="h-button font-bold"
        >
          {confirmLabel}
        </StyledButton>
      </div>
    </dialog>
  );
}
