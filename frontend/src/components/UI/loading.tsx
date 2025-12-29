import { useState, useEffect } from "react";

/**
 * Loading component that displays a loading message after a specified delay.
 */
export default function Loading({
  text = "Načítání...",
  timeDelay = 1000,
}: {
  text?: string;
  timeDelay?: number;
}) {
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
