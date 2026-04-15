import BaseButton from './BaseButton';
import type { ReactNode } from 'react';

interface MenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
}

/**
 * A menu button component that renders a button with bold text aligned to the left.
 *
 * MenuButton wraps its children in a <p> element.
 * Pass only inline elements or text as children (not <p>, <div>, etc.).
 *
 * @component
 * @param children - The content to display inside the button
 * @param className - Optional CSS class names to apply to the button
 * @return A styled button element with the provided content and styles
 */
export function MenuButton({ children, className, ...rest }: MenuButtonProps) {
  return (
    <BaseButton {...rest} className={`h-button ${className}`}>
      <div className="w-full text-left">{children}</div>
    </BaseButton>
  );
}
