import { useToastStore } from "./use-toast-store";
import Toast from "./Toast";

export default function ToastContainer() {
  const { message, type, visible } = useToastStore();
  if (!visible) return null;
  return <Toast message={message} type={type} />;
}
