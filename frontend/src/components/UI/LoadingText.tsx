import { useState, useEffect } from 'react';
import { TEXTS } from '@/config/texts';

type LoadingTextProps = {
  text?: string;
  timeDelay?: number;
};

/**
 * Displays a loading message after a specified delay.
 *
 * @param text Loading message to display.
 * @param timeDelay Delay before showing the loading message (ms).
 */
export default function LoadingText({
  text = TEXTS.buttonLoading,
  timeDelay = 1000,
}: LoadingTextProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), timeDelay);
    return () => clearTimeout(timer);
  }, [timeDelay]);

  if (!show) return null;

  return <p>{text}</p>;
}
