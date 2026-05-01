import type { HTMLAttributes } from 'react';

/**
 * Displays a centered notification message with customizable styling.
 */
export default function Notification(props: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div {...props} className={`font-headings text-center text-xl ${props.className}`}>
      {props.children}
    </div>
  );
}
