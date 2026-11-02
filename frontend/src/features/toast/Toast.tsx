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
 * @returns A styled notification that dismisses when clicked.
 */
export default function Toast({ message, type = 'info' }: ToastProps): JSX.Element {
  const hideToast = useToastStore((state) => state.hideToast);

  return (
    <button
      type="button"
      aria-label={ARIA_TEXTS.dismissNotification}
      onClick={hideToast}
      className={`z-modal text-dark absolute top-0 right-0 flex min-h-input w-fit max-w-full cursor-pointer items-center px-4 text-left hover:bg-button-hover hover:text-light focus-visible:bg-button-hover focus-visible:text-light focus-visible:outline-none ${typeStyles[type]}`}
    >
      {message}
    </button>
  );
}
