import StyledButton from './StyledButton';
import type { ButtonHTMLAttributes } from 'react';

/**
 * A styled menu button component.
 */
export function MenuButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <StyledButton {...props} className={`h-button text-left ${props.className}`}>
      {props.children}
    </StyledButton>
  );
}
