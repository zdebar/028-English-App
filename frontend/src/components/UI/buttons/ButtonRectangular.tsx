import type { JSX } from 'react';

interface ButtonRectangularProps {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Button component for rendering a styled button element.
 *
 * @param children Content to be displayed inside the button.
 * @param onClick Function to call when button is clicked.
 * @param disabled Whether the button is disabled.
 * @param className Additional CSS classes for custom styling.
 * @returns {JSX.Element} The rendered button element.
 */
export default function ButtonRectangular({
  children,
  onClick,
  disabled = false,
  className = '',
}: ButtonRectangularProps): JSX.Element {
  return (
    <button
      type="button"
      className={`button-rectangular button-color ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
