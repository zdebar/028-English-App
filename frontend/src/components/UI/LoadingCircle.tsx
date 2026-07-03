import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

type LoadingCircleProps = Readonly<{
  label?: string;
  className?: string;
}>;

export default function LoadingCircle({
  label = TEXTS.loadingMessage,
  className = '',
}: LoadingCircleProps): JSX.Element {
  return (
    <div className={`flex w-full justify-center py-4 ${className}`.trim()}>
      <output
        aria-label={label}
        aria-live="polite"
        className="border-button-light dark:border-button-dark border-t-button-hover size-8 animate-spin rounded-full border-4"
      />
    </div>
  );
}
