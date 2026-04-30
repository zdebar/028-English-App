import { useState, useEffect, type ReactNode } from 'react';
import config from '@/config/config';

type DelayedMessageProps = Readonly<{
  children?: ReactNode;
  timeDelay?: number;
  className?: string;
}>;

/**
 * Displays a delayed content after a specified delay.
 *
 * @param children The content to display after the delay.
 * @param timeDelay Delay before showing the content (ms).
 * @param className Optional CSS class for styling the content.
 */
export default function Delayed({
  children,
  timeDelay = config.buttons.loadingMessageDelay,
  className = '',
}: DelayedMessageProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), timeDelay);
    return () => clearTimeout(timer);
  }, [timeDelay]);

  if (!show) {
    return null;
  }

  return <div className={className}>{children}</div>;
}
