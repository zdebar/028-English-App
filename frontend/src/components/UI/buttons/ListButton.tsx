import type { ButtonHTMLAttributes, JSX } from 'react';
import StyledButton from './StyledButton';

type ListButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Lets multiline list content determine the row height. */
  flexibleHeight?: boolean;
};

/**
 * A styled list button component.
 */
export function ListButton({
  flexibleHeight = false,
  className = '',
  children,
  ...props
}: Readonly<ListButtonProps>): JSX.Element {
  return (
    <StyledButton
      {...props}
      className={`${flexibleHeight ? 'min-h-input' : 'h-input'} preserve-disabled-text-color w-full grow-0 ${className}`}
    >
      {children}
    </StyledButton>
  );
}
