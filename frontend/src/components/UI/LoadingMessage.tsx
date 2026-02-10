import { useState, useEffect } from 'react';
import { TEXTS } from '@/locales/cs';
import config from '@/config/config';

type LoadingMessageProps = {
  text?: string;
  timeDelay?: number;
  className?: string;
};

/**
 * Displays a loading message after a specified delay.
 *
 * @param text Loading message to display.
 * @param timeDelay Delay before showing the loading message (ms).
 * @param className Optional CSS class for styling the message.
 */
export default function LoadingMessage({
  text = TEXTS.loadingMessage,
  timeDelay = config.buttons.loadingMessageDelay,
  className = '',
}: LoadingMessageProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), timeDelay);
    return () => clearTimeout(timer);
  }, [timeDelay]);

  if (!show) return null;

  return <p className={className}>{text}</p>;
}
