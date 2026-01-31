import type { JSX } from 'react';

interface IndicatorProps {
  className?: string;
}

/**
 * A component that renders a dot indicator.
 *
 * @param className Additional CSS classes to apply to the indicator. Defaults to an empty string.
 * @returns The rendered indicator element.
 */
export default function Indicator({ className = '' }: IndicatorProps): JSX.Element {
  return <span className={`h-indicator w-indicator rounded-full ${className}`} />;
}
