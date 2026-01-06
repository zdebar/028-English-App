import { useToastStore } from "./use-toast-store";
import Toast from "./Toast";

/**
 * ToastContainer component that displays toast notifications from the toast store.
 *
 * @returns The toast notification element or null if not visible.
 */
export default function ToastContainer() {
  const { message, type, visible } = useToastStore();
  if (!visible) return null;
  return <Toast message={message} type={type} />;
}
