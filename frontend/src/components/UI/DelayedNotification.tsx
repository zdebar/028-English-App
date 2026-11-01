import Delayed from './Delayed';
import Notification from './Notification';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

type DelayedNotificationProps = Readonly<{
  message?: string;
  timeDelay?: number;
  className?: string;
}>;

/**
 * Shows a text notification after a short delay.
 */
export default function DelayedNotification({
  message = TEXTS.loadingMessage,
  timeDelay,
  className = '',
}: DelayedNotificationProps): JSX.Element {
  return (
    <Delayed timeDelay={timeDelay} className="w-full">
      <Notification className={className}>{message}</Notification>
    </Delayed>
  );
}
