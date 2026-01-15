interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const typeStyles: Record<string, string> = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
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
