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
    <button
      type="button"
      className={`h-button button-color flex shrink-0 grow cursor-pointer items-center justify-center font-bold tracking-wide disabled:cursor-default ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
