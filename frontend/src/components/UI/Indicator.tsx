import type { HTMLAttributes, JSX } from 'react';

/**
 * A component that renders a dot indicator.
 */
export default function Indicator(props: Readonly<HTMLAttributes<HTMLSpanElement>>): JSX.Element {
  const { className, ...rest } = props as HTMLAttributes<HTMLSpanElement> & { className?: string };
  const combined = `size-indicator bg-indicator rounded-full ${className ?? ''}`.trim();

  return <span className={combined} {...rest} />;
}
