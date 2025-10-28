import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  buttonType?: string;
  buttonColor?: string;
}

export default function Button({
  children,
  className = "",
  disabled = false,
  buttonType = "button-rectangular",
  buttonColor = "color-button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${className} ${buttonType} ${
        disabled ? "color-disabled" : buttonColor
      } `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
