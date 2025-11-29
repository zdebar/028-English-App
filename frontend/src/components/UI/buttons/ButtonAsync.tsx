import React from "react";

interface ButtonAsyncProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  message?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  onClick: () => void;
  className?: string;
}

/**
 * Asynchronous button component that displays a loading message.
 * @param param0
 * @returns
 */
export default function ButtonAsync({
  message,
  disabled = false,
  isLoading = false,
  loadingMessage = "Načítání...",
  onClick,
  className = "",
  ...props
}: ButtonAsyncProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      <span className="text-button">
        {isLoading ? loadingMessage : message}
      </span>
    </button>
  );
}
