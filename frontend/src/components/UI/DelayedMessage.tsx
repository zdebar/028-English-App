import { TEXTS } from '@/locales/cs';
import type { JSX, ReactNode } from 'react';
import config from '@/config/config';
import Delayed from './Delayed';
import Notification from './Notification';

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
    <Delayed timeDelay={timeDelay} className="w-full">
      <Notification className={className}>{children ?? message}</Notification>
    </Delayed>
  );
}
