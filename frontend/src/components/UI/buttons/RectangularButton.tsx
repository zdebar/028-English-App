import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Props for the ButtonRectangular component.
 * @property {ReactNode} children - The content of the button.
 * @property {string} [className] - Additional CSS classes for styling.
 */
export interface RectangularButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

/**
 * A rectangular button component with tailwind classes "shape-button-rectangular color-button".
 */
export default function RectangularButton({
  children,
  className = "",
  ...props
}: RectangularButtonProps) {
  return (
    <button
      className={`shape-button-rectangular color-button ${className}`}
      aria-disabled={props.disabled}
      {...props}
    >
      {children}
    </button>
  );
}
