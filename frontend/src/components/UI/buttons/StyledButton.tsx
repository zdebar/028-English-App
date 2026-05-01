import type { ButtonHTMLAttributes, JSX } from 'react';

/**
 * Button component for rendering a styled button element.
 */
export default function StyledButton(
  props: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>,
): JSX.Element {
  return (
    <button
      type="button"
      {...props}
      className={`color-button flex grow cursor-pointer items-center justify-center overflow-hidden tracking-wide text-ellipsis whitespace-nowrap disabled:cursor-default ${props.className}`}
    >
      {props.children}
    </button>
  );
}
