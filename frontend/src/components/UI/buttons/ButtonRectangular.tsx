import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonRectangularProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

/**
 * Button component for rendering a styled button element.
 *
 * @param children The content to be displayed inside the button.
 * @param className Additional CSS classes for custom styling.
 */
export default function ButtonRectangular({
  children,
  className = '',
  ...rest
}: ButtonRectangularProps) {
  return (
    <button type="button" className={`button-rectangular button-color ${className}`} {...rest}>
      {children}
    </button>
  );
}
