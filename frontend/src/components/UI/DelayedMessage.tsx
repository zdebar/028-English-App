import { TEXTS } from '@/locales/cs';
import type { JSX, ReactNode } from 'react';
import config from '@/config/config';
import DelayedNotification from './DelayedNotification';

type DelayedMessageProps = Readonly<{
  message?: string;
  timeDelay?: number;
  className?: string;
  children?: ReactNode;
}>;

/**
 * Shows a message after a short delay.
 */
export default function DelayedMessage({
  message = TEXTS.loadingMessage,
  timeDelay = config.loading.dataStateDelayMs,
  className = '',
  children,
}: DelayedMessageProps): JSX.Element {
  return (
    <DelayedNotification
      message={message}
      timeDelay={timeDelay}
      className={className}
    >
      {children}
    </DelayedNotification>
  );
}
