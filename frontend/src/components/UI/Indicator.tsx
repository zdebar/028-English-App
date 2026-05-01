import type { HTMLAttributes } from 'react';

/**
 * A component that renders a dot indicator.
 */
export default function Indicator(props: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`size-indicator bg-indicator rounded-full ${props.className}`} {...props} />
  );
}
