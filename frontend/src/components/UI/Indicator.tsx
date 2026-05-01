import type { HTMLAttributes, JSX } from 'react';

/**
 * A component that renders a dot indicator.
 */
export default function Indicator(props: Readonly<HTMLAttributes<HTMLSpanElement>>): JSX.Element {
  return (
    <span className={`size-indicator bg-indicator rounded-full ${props.className}`} {...props} />
  );
}
