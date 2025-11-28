import CloseButton from "@/components/UI/buttons/CloseButton";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
}

const typeStyles: Record<string, string> = {
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
  info: "bg-blue-500 text-white",
};

export default function Toast({ message, type = "info", onClose }: ToastProps) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${typeStyles[type]}`}
    >
      <span>{message}</span>
      {onClose && <CloseButton onClick={onClose}></CloseButton>}
    </div>
  );
}
