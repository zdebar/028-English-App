import Toast from './Toast';
import { useToastStore } from './use-toast-store';

/**
 * ToastContainer component that displays toast notifications from the toast store.
 *
 * @returns The toast notification element or null if not visible.
 */
export default function ToastContainer() {
  const message = useToastStore((state) => state.message);
  const type = useToastStore((state) => state.type);
  const visible = useToastStore((state) => state.visible);

  if (!visible) return null;

  return <Toast message={message} type={type} />;
}
