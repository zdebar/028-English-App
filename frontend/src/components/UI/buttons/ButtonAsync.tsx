import { useState, useEffect, useRef } from 'react';
import { TEXTS } from '@/config/texts';

interface ButtonAsyncProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  message?: string;
  loadingMessage?: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  minLoadingTime?: number;
  className?: string;
}

/**
 * Asynchronous button component that displays a loading message for at least a minimum duration.
 *
 * @param message Text to display when not loading.
 * @param loadingMessage Text to display while loading.
 * @param onClick Function to call when button is clicked.
 * @param isLoading Whether the button is in loading state.
 * @param disabled Whether the button is disabled.
 * @param minLoadingTime Minimum time to show loading message (ms).
 * @param className Additional CSS classes for custom styling.
 * @param props Standard button attributes.
 */
export default function ButtonAsync({
  message = TEXTS.buttonDefault,
  loadingMessage = TEXTS.buttonLoading,
  onClick,
  isLoading = false,
  disabled = false,
  minLoadingTime = 400,
  className = '',
  ...props
}: ButtonAsyncProps) {
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) return;

    setMinLoadingElapsed(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMinLoadingElapsed(true), minLoadingTime);
  }, [isLoading, minLoadingTime]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isButtonLoading = isLoading || !minLoadingElapsed;

  return (
    <button
      {...props}
      onClick={onClick}
      disabled={isButtonLoading || disabled}
      className={className}
    >
      <span>{isButtonLoading ? loadingMessage : message}</span>
    </button>
  );
}
