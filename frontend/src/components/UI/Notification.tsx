import type { HTMLAttributes, JSX } from 'react';

/**
 * Displays a centered notification message with customizable styling.
 */
export default function Notification(
  props: Readonly<HTMLAttributes<HTMLParagraphElement>>,
): JSX.Element {
  return (
    <div {...props} className={`font-headings text-center text-xl ${props.className}`}>
      {props.children}
    </div>
  );
}
