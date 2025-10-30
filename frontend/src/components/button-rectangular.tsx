import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonRectangularProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function ButtonRectangular({
  children,
  className = "",
  disabled = false,
  ...props
}: ButtonRectangularProps) {
  return (
    <button
      className={` button-rectangular color-button
       ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
