import StyledButton from './StyledButton';
import type { ReactNode } from 'react';

type ListButtonProps = Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: ReactNode;
    className?: string;
  }
>;

/**
 * A list button component that renders a button with bold text aligned to the left.
 *
 * ListButton wraps its children in a <div> element.
 * Pass only inline elements or text as children (not <p>, <div>, etc.).
 *
 * @component
 * @param children - The content to display inside the button
 * @param className - Optional CSS class names to apply to the button
 * @return A styled button element with the provided content and styles
 */
export function ListButton({ children, className, ...rest }: ListButtonProps) {
  return (
    <StyledButton {...rest} className={`h-input ${className}`}>
      <div className="overflow-hidden text-left text-ellipsis whitespace-nowrap">{children}</div>
    </StyledButton>
  );
}
