import type { ButtonHTMLAttributes, JSX } from 'react';
import StyledButton from './StyledButton';

/**
 * A styled list button component.
 */
export function ListButton(props: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>): JSX.Element {
  return (
    <StyledButton {...props} className={`h-input ${props.className}`}>
      {props.children}
    </StyledButton>
  );
}
