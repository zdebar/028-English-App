import CloseIcon from '@/components/UI/icons/CloseIcon';
import { ARIA_TEXTS } from '@/locales/cs';
import { useToastStore, type ToastType } from './use-toast-store';
import type { JSX } from 'react';

const typeStyles = {
  success: 'bg-success-light',
  error: 'bg-error-light',
  info: 'bg-info-light',
};

type ToastProps = Readonly<{
  message: string;
  type?: ToastType;
}>;

/**
 * Toast component for displaying brief notification messages.
 *
 * @param message The notification message.
 * @param type The type of toast ("success", "error", or "info"). Defaults to "info".
 * @returns A styled notification with a labelled dismiss button.
 */
export default function Toast({ message, type = 'info' }: ToastProps): JSX.Element {
  const hideToast = useToastStore((state) => state.hideToast);

  return (
    <div
      className={`z-modal text-dark absolute top-0 right-0 flex items-center gap-3 px-4 py-2 ${typeStyles[type]}`}
    >
      <span aria-hidden="true">{message}</span>
      <button
        type="button"
        aria-label={ARIA_TEXTS.dismissNotification}
        onClick={hideToast}
        className="size-button hover:bg-button-hover hover:text-light focus-visible:bg-button-hover focus-visible:text-light inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none"
      >
        <CloseIcon size={20} />
      </button>
    </div>
  );
}
