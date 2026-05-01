import type { ButtonHTMLAttributes } from 'react';
import StyledButton from './StyledButton';

/**
 * A styled list button component.
 */
export function ListButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <StyledButton {...props} className={`h-input ${props.className}`}>
      {props.children}
    </StyledButton>
  );
}
