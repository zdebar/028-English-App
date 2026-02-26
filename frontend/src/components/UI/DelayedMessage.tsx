import { useState, useEffect } from 'react';
import { TEXTS } from '@/locales/cs';
import config from '@/config/config';

type DelayedMessageProps = {
  text?: string;
  timeDelay?: number;
  className?: string;
};

/**
 * Displays a delayed message after a specified delay.
 *
 * @param text Message to display.
 * @param timeDelay Delay before showing the message (ms).
 * @param className Optional CSS class for styling the message.
 */
export default function DelayedMessage({
  text = TEXTS.loadingMessage,
  timeDelay = config.buttons.loadingMessageDelay,
  className = '',
}: DelayedMessageProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), timeDelay);
    return () => clearTimeout(timer);
  }, [timeDelay]);

  if (!show) return null;

  return <p className={className}>{text}</p>;
}
