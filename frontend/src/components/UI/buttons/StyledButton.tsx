import type { ButtonHTMLAttributes } from 'react';

/**
 * Button component for rendering a styled button element.
 */
export default function StyledButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
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
