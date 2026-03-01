import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
}

/**
 * Button component for rendering a styled button element.
 *
 * @param children The content to be displayed inside the button.
 * @param className Additional CSS classes for custom styling.
 */
export default function BaseButton({ children, className = '', ...rest }: BaseButtonProps) {
  return (
    <button
      type="button"
      className={`button-color flex shrink-0 grow cursor-pointer items-center justify-center tracking-wide disabled:cursor-default ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
