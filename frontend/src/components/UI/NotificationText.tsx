import type { JSX } from 'react';

type NotificationTextProps = {
  text: string;
  className?: string;
} & React.HTMLAttributes<HTMLParagraphElement>;
/**
 * Displays a centered notification message with customizable styling.
 *
 * @param text - The notification text to display
 * @param className - Additional CSS classes to apply to the paragraph element
 * @returns A paragraph element with notification styling
 */
export default function NotificationText({
  text,
  className,
  ...rest
}: NotificationTextProps): JSX.Element {
  return (
    <p {...rest} className={`font-headings text-center text-xl ${className}`}>
      {text}
    </p>
  );
}
