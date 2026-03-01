import type { JSX } from 'react';

interface NotificationTextProps {
  text: string;
  className?: string;
}

/**
 * Displays a centered notification message with customizable styling.
 *
 * @param text - The notification text to display
 * @param className - Additional CSS classes to apply to the paragraph element
 * @returns A paragraph element with notification styling
 */
export default function NotificationText({ text, className }: NotificationTextProps): JSX.Element {
  return <p className={`font-headings text-center text-xl ${className}`}>{text}</p>;
}
