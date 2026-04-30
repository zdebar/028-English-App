import Delayed from './Delayed';
import Notification from './Notification';
import { TEXTS } from '@/locales/cs';
import type { ReactNode } from 'react';

interface DelayedNotificationProps {
  message?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Shows a notification after a short delay (for loading or info states).
 * If children are provided, they are rendered inside Notification instead of the default message.
 */
export default function DelayedNotification({
  message = TEXTS.loadingMessage,
  className = 'color-info pt-4',
  children,
}: DelayedNotificationProps) {
  return (
    <Delayed>
      <Notification className={className}>{children ?? message}</Notification>
    </Delayed>
  );
}
