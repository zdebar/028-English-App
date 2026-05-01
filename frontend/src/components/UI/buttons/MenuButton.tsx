import StyledButton from './StyledButton';
import type { ButtonHTMLAttributes, JSX } from 'react';

/**
 * A styled menu button component.
 */
export function MenuButton(props: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>): JSX.Element {
  return (
    <StyledButton {...props} className={`h-button text-left ${props.className}`}>
      {props.children}
    </StyledButton>
  );
}
