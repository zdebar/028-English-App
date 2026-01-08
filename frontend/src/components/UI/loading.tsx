import { useState, useEffect } from 'react';

type LoadingProps = {
  text?: string;
  timeDelay?: number;
};

/**
 * Displays a loading message after a specified delay.
 */
export default function Loading({ text = 'Načítání...', timeDelay = 1000 }: LoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), timeDelay);
    return () => clearTimeout(timer);
  }, [timeDelay]);

  if (!show) return null;

  return (
    <p role="status" aria-live="polite" className="text-center">
      {text}
    </p>
  );
}
