import Toast from './Toast';
import { useToastStore } from './use-toast-store';
import type { JSX } from 'react';

/**
 * ToastContainer component that displays toast notifications from the toast store.
 *
 * @returns {JSX.Element | null} The rendered Toast component or null.
 */
export default function ToastContainer(): JSX.Element | null {
  const message = useToastStore((state) => state.message);
  const type = useToastStore((state) => state.type);
  const visible = useToastStore((state) => state.visible);

  if (!visible) return null;

  return <Toast message={message} type={type} />;
}
