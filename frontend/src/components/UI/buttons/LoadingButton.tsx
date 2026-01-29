import { useState, useEffect, useRef } from 'react';
import { TEXTS } from '@/config/texts';
import config from '@/config/config';

interface LoadingButtonProps {
  message?: string;
  loadingMessage?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  minLoadingTime?: number;
  className?: string;
}

/**
 * Loading button component that displays a loading message for at least a minimum duration.
 *
 * @param message Text to display when not loading.
 * @param loadingMessage Text to display while loading.
 * @param onClick Function to call when button is clicked.
 * @param isLoading Whether the button is in loading state.
 * @param disabled Whether the button is disabled.
 * @param minLoadingTime Minimum time to show loading message (ms).
 * @param className Additional CSS classes for custom styling.
 */
export default function LoadingButton({
  message = TEXTS.buttonDefault,
  loadingMessage = TEXTS.buttonLoading,
  onClick,
  isLoading = false,
  disabled = false,
  minLoadingTime = config.buttons.minLoadingTime,
  className = '',
}: LoadingButtonProps) {
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) return;

    setMinLoadingElapsed(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setMinLoadingElapsed(true);
      timerRef.current = null;
    }, minLoadingTime);
  }, [isLoading, minLoadingTime]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isButtonLoading = isLoading || !minLoadingElapsed;

  return (
    <button
      onClick={onClick}
      disabled={isButtonLoading || disabled}
      className={`button-rectangular button-color ${className}`}
    >
      <span>{isButtonLoading ? loadingMessage : message}</span>
    </button>
  );
}
