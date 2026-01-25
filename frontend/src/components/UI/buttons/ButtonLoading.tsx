import { useState, useEffect, useEffectEvent } from 'react';
import { TEXTS } from '@/config/texts';
import ButtonRectangular from './ButtonRectangular';

interface ButtonLoadingProps {
  message?: string;
  loadingMessage?: string;
  onClick: () => void;
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
export default function ButtonLoading({
  message = TEXTS.buttonDefault,
  loadingMessage = TEXTS.buttonLoading,
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
    <ButtonRectangular
      onClick={onClick}
      disabled={isButtonLoading || disabled}
      className={className}
    >
      <span>{isButtonLoading ? loadingMessage : message}</span>
    </ButtonRectangular>
  );
}
