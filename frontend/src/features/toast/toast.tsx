import { type ToastType } from './use-toast-store';
import type { JSX } from 'react';

const typeStyles: Record<ToastType, string> = {
  success: 'bg-toast-success',
  error: 'bg-toast-error',
  info: 'bg-toast-info',
};

/**
 * Toast component for displaying brief notification messages.
 *
 * @param message The message to display in the toast.
 * @param type The type of toast ("success", "error", or "info"). Defaults to "info".
 * @returns A styled toast notification element.
 */
export default function Toast({
  message,
  type = 'info',
}: {
  message: string;
  type?: ToastType;
}): JSX.Element {
  return (
    <div className={`z-modal text-dark absolute top-0 right-0 px-4 py-2 ${typeStyles[type]}`}>
      {message}
    </div>
  );
}
