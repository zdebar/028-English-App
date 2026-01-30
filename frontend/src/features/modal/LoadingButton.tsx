import { useState, useEffect, useRef } from 'react';
import { TEXTS } from '@/config/texts.config';
import config from '@/config/config';

interface LoadingButtonProps {
  buttonText?: string;
  loadingText?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  minLoadingTime?: number;
  className?: string;
}

/**
 * Loading button component that displays a loading message for at least a minimum duration.
 *
 * @param buttonText Text to display when not loading.
 * @param loadingText Text to display while loading.
 * @param onClick Function to call when button is clicked.
 * @param isLoading Whether the button is in loading state.
 * @param disabled Whether the button is disabled.
 * @param minLoadingTime Minimum time to show loading message (ms).
 * @param className Additional CSS classes for custom styling.
 */
export default function LoadingButton({
  buttonText = TEXTS.buttonDefault,
  loadingText = TEXTS.buttonLoading,
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
      <span>{isButtonLoading ? loadingText : buttonText}</span>
    </button>
  );
}
