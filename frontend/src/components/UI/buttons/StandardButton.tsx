import StyledButton from './StyledButton';
import type { ButtonHTMLAttributes, JSX } from 'react';

/**
 * A styled standard button component.
 */
export function StandardButton(
  props: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>,
): JSX.Element {
  return (
    <StyledButton {...props} className={`h-button ${props.className}`}>
      {props.children}
    </StyledButton>
  );
}
