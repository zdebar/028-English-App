import type { HTMLAttributes, JSX } from 'react';
import Notification from './Notification';

/**
 * Displays an info-colored notification message.
 */
export default function InfoNotification(
  props: Readonly<HTMLAttributes<HTMLDivElement>>,
): JSX.Element {
  const { className, ...rest } = props;

  return <Notification {...rest} className={`color-info ${className ?? ''}`.trim()} />;
}
