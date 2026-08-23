import type { HTMLAttributes, JSX } from 'react';

/**
 * Displays a centered notification message with customizable styling.
 */
export default function Notification(props: Readonly<HTMLAttributes<HTMLDivElement>>): JSX.Element {
  const { children, className, ...rest } = props;

  return (
    <div {...rest} className={`font-headings text-center text-lg ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}
