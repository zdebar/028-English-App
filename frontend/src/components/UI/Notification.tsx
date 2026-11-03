import type { HTMLAttributes, JSX, ReactNode } from 'react';

type NotificationProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    children: ReactNode;
  }
>;

/**
 * Displays a centered notification message with customizable styling.
 */
export default function Notification(props: NotificationProps): JSX.Element {
  const { children, className, ...rest } = props;

  return (
    <div {...rest} className={`font-headings text-center text-lg ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}
