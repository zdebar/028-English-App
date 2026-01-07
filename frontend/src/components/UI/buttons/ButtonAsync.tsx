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
 * @param message The button label when not loading.
 * @param loadingMessage The label shown while loading (default: "Načítání...").
 * @param onClick Function called when the button is clicked.
 * @param isLoading Controls the loading state of the button.
 * @param disabled Disables the button if true.
 * @param minLoadingTime Minimum time (ms) to show the loading message (default: 400).
 * @param className Additional CSS classes for custom styling.
 * @param props Other standard button attributes.
 * @returns A styled button element with loading feedback.
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
