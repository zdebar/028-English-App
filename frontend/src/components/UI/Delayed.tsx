import { useState, useEffect, type HTMLAttributes, type JSX, type ReactNode } from 'react';
import config from '@/config/config';

type DelayedProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    children: ReactNode;
    timeDelay?: number;
  }
>;

/**
 * Displays a delayed content after a specified delay.
 *
 * @param timeDelay Delay before showing the content (ms).
 */
export default function Delayed({
  timeDelay = config.loading.dataStateDelayMs,
  children,
  ...rest
}: DelayedProps): JSX.Element | null {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), timeDelay);
    return () => clearTimeout(timer);
  }, [timeDelay]);

  if (!show) {
    return null;
  }

  return <div {...rest}>{children}</div>;
}
