import { type ToastType } from './use-toast-store';

interface ToastProps {
  message: string;
  type?: ToastType;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
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
    <div className={`absolute top-0 right-0 z-50 px-4 py-2 ${typeStyles[type]}`}>{message}</div>
  );
}
