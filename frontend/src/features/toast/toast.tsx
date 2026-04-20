import { useToastStore, type ToastType } from './use-toast-store';
import type { JSX, MouseEvent, ReactNode } from 'react';

const typeStyles = {
  success: 'bg-success-light',
  error: 'bg-error-light',
  info: 'bg-info-light',
};

type ToastProps = {
  readonly children?: ReactNode;
  readonly type?: ToastType;
};

/**
 * Toast component for displaying brief notification messages.
 *
 * @param children The content to display in the toast.
 * @param type The type of toast ("success", "error", or "info"). Defaults to "info".
 * @returns A styled toast notification element.
 */
export default function Toast({ children, type = 'info' }: ToastProps): JSX.Element {
  const hideToast = useToastStore((state) => state.hideToast);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    hideToast();
  };

  return (
    <button
      type="button"
      className={`z-modal text-dark absolute top-0 right-0 cursor-pointer px-4 py-2 ${typeStyles[type]}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
