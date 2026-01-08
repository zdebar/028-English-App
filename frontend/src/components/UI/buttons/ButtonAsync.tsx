import { useState, useEffect } from 'react';

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
  message,
  loadingMessage = 'Načítání...',
  onClick,
  isLoading = false,
  disabled = false,
  minLoadingTime = 400,
  className = '',
  ...props
}: ButtonAsyncProps) {
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setMinLoadingElapsed(false);
      timer = setTimeout(() => setMinLoadingElapsed(true), minLoadingTime);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, minLoadingTime]);

  const isButtonLoading = isLoading || !minLoadingElapsed;

  return (
    <button
      onClick={onClick}
      disabled={isButtonLoading || disabled}
      className={className}
      {...props}
    >
      <span className="text-button">{isButtonLoading ? loadingMessage : message}</span>
    </button>
  );
}
