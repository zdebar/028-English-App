import type { ButtonHTMLAttributes, JSX } from 'react';
import StyledButton from './StyledButton';

/**
 * A styled list button component.
 */
export function ListButton(props: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>): JSX.Element {
  return (
    <StyledButton
      {...props}
      className={`h-input w-full grow-0 preserve-disabled-text-color ${props.className}`}
    >
      {props.children}
    </StyledButton>
  );
}
