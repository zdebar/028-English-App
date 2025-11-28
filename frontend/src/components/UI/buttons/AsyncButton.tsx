import React from "react";
import RectangularButton from "@/components/UI/buttons/RectangularButton";

interface AsyncButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  message: string;
  disabled?: boolean;
  isLoading: boolean;
  loadingMessage?: string;
  onClick: () => void;
  className?: string;
}

export default function AsyncButton({
  message,
  disabled = false,
  isLoading,
  loadingMessage = "Načítání...",
  onClick,
  className = "",
  ...props
}: AsyncButtonProps) {
  return (
    <RectangularButton
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      <p className="text-button">{isLoading ? loadingMessage : message}</p>
    </RectangularButton>
  );
}
