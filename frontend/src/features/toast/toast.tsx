import { useToastStore, type ToastType } from './use-toast-store';
import type { JSX, MouseEvent } from 'react';

const typeStyles: Record<ToastType, string> = {
  success: 'bg-success-light',
  error: 'bg-error-light',
  info: 'bg-info-light',
};

interface ToastProps {
  message: string;
  type?: ToastType;
}

/**
 * Toast component for displaying brief notification messages.
 *
 * @param message The message to display in the toast.
 * @param type The type of toast ("success", "error", or "info"). Defaults to "info".
 * @returns A styled toast notification element.
 */
export default function Toast({ message, type = 'info' }: ToastProps): JSX.Element {
  const hideToast = useToastStore((state) => state.hideToast);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    hideToast();
  };

  return (
    <div
      className={`z-modal text-dark absolute top-0 right-0 px-4 py-2 ${typeStyles[type]}`}
      onClick={handleClick}
    >
      {message}
    </div>
  );
}
