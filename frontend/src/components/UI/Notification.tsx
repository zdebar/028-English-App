import type { JSX } from 'react';

type NotificationProps = Readonly<
  {
    children?: React.ReactNode;
    className?: string;
  } & React.HTMLAttributes<HTMLParagraphElement>
>;

/**
 * Displays a centered notification message with customizable styling.
 *
 * @param children - The notification content to display
 * @param className - Additional CSS classes to apply to the paragraph element
 * @returns A paragraph element with notification styling
 */
export default function Notification({
  children,
  className,
  ...rest
}: NotificationProps): JSX.Element {
  return (
    <div {...rest} className={`font-headings text-center text-xl ${className}`}>
      {children}
    </div>
  );
}
