import { useState, useEffect } from "react";

interface ButtonAsyncProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  message?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  onClick: () => void;
  className?: string;
  minLoadingTime?: number;
}

/**
 * Asynchronous button component that displays a loading message.
 */
export default function ButtonAsync({
  message,
  disabled = false,
  isLoading = false,
  loadingMessage = "Načítání...",
  onClick,
  className = "",
  minLoadingTime = 400,
  ...props
}: ButtonAsyncProps) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setShowLoading(true);
      timer = setTimeout(() => {
        if (!isLoading) setShowLoading(false);
      }, minLoadingTime);
    } else {
      timer = setTimeout(() => setShowLoading(false), minLoadingTime);
    }
    return () => clearTimeout(timer);
  }, [isLoading, minLoadingTime]);

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      <span className="text-button">
        {showLoading ? loadingMessage : message}
      </span>
    </button>
  );
}
