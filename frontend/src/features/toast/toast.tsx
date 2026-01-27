import { type ToastType } from './use-toast-store';

interface ToastProps {
  message: string;
  type?: ToastType;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-toast-success text-white',
  error: 'bg-toast-error text-white',
  info: 'bg-toast-info text-white',
};

/**
 * Toast component for displaying brief notification messages.
 *
 * @param message The message to display in the toast.
 * @param type The type of toast ("success", "error", or "info"). Defaults to "info".
 * @returns A styled toast notification element.
 */
export default function Toast({ message, type = 'info' }: ToastProps) {
  return (
    <div className={`z-modal absolute top-0 right-0 px-4 py-2 ${typeStyles[type]}`}>{message}</div>
  );
}
