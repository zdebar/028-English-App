import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Props for the ButtonRectangular component.
 * @property {ReactNode} children - The content of the button.
 * @property {boolean} [disabled] - Whether the button is disabled.
 * @property {string} [className] - Additional CSS classes for styling.
 */
export interface RectangularButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * A rectangular button component - h-button, w-full.
 */
export default function RectangularButton({
  children,
  className = "",
  disabled = false,
  ...props
}: RectangularButtonProps) {
  return (
    <button
      className={`button-rectangular color-button ${className}`}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
