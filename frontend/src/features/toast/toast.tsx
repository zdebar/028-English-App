interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
}

const typeStyles: Record<string, string> = {
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
  info: "bg-blue-500 text-white",
};

export default function Toast({ message, type = "info" }: ToastProps) {
  return (
    <div
      className={`absolute top-0 right-0 z-50 px-4 py-2 ${typeStyles[type]}`}
    >
      <span>{message}</span>
    </div>
  );
}
