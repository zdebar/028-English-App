import { useState, useEffect, type HTMLAttributes, type JSX } from 'react';
import config from '@/config/config';

type DelayedMessageProps = Readonly<{
  timeDelay?: number;
}> &
  HTMLAttributes<HTMLDivElement>;

/**
 * Displays a delayed content after a specified delay.
 *
 * @param timeDelay Delay before showing the content (ms).
 */
export default function Delayed({
  timeDelay = config.buttons.loadingMessageDelay,
  ...rest
}: DelayedMessageProps): JSX.Element | null {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), timeDelay);
    return () => clearTimeout(timer);
  }, [timeDelay]);

  if (!show) {
    return null;
  }

  return <div {...rest}>{rest.children}</div>;
}
