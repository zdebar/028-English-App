import React from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Props for the ButtonRectangular component.
 * @property {ReactNode} children - The content of the button.
 * @property {boolean} [disabled] - Whether the button is disabled.
 * @property {string} [className] - Additional CSS classes for styling.
 */
export interface ButtonRectangularProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * A rectangular button component - h-button, w-full.
 */
function ButtonRectangular({
  children,
  className = "",
  disabled = false,
  ...props
}: ButtonRectangularProps) {
  return (
    <button
      className={` button-rectangular ${
        disabled ? "color-disabled" : "color-button"
      } 
       ${className}`}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default React.memo(ButtonRectangular);
