import React from "react";
import RectangularButton from "@/components/UI/buttons/RectangularButton";

interface AsyncButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  message: string;
  disabled?: boolean;
  loadingMessage?: string;
  onClick: () => void;
  className?: string;
}

export default function AsyncButton({
  isLoading,
  message,
  disabled = false,
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
