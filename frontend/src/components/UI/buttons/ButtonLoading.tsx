import { useState, useEffect, useEffectEvent } from 'react';
import { TEXTS } from '@/config/texts';

interface ButtonLoadingProps {
  label?: string;
  loadingLabel?: string;
  onClick: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  minLoadingTime?: number;
  className?: string;
}

/**
 * Loading button component that displays a loading message for at least a minimum duration.
 *
 * @param label Text to display when not loading.
 * @param loadingLabel Text to display while loading.
 * @param onClick Function to call when button is clicked.
 * @param isLoading Whether the button is in loading state.
 * @param disabled Whether the button is disabled.
 * @param minLoadingTime Minimum time to show loading message (ms).
 * @param className Additional CSS classes for custom styling.
 */
export default function ButtonLoading({
  label: message = TEXTS.buttonDefault,
  loadingLabel: loadingMessage = TEXTS.buttonLoading,
  onClick,
  isLoading = false,
  disabled = false,
  minLoadingTime = 400,
  className = '',
}: ButtonLoadingProps) {
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(true);
  const onTimer = useEffectEvent(() => setMinLoadingElapsed(true));

  useEffect(() => {
    if (!isLoading) return;

    setMinLoadingElapsed(false);

    const timer = setTimeout(onTimer, minLoadingTime);
    return () => clearTimeout(timer);
  }, [isLoading, minLoadingTime, onTimer]);

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
