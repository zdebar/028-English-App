import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  title?: string;
  className?: string;
}

/**
 * Button component for rendering a styled button element.
 *
 * @param children The content to be displayed inside the button.
 * @param title The tooltip text to be shown on hover.
 * @param className Additional CSS classes for custom styling.
 */
export default function BaseButton({ children, title, className = '', ...rest }: BaseButtonProps) {
  return (
    <button
      type="button"
      className={`color-button flex shrink-0 grow cursor-pointer items-center justify-center tracking-wide disabled:cursor-default ${className}`}
      title={title}
      {...rest}
    >
      {children}
    </button>
  );
}
