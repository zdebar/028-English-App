interface IndicatorProps {
  className?: string;
}

/**
 * A component that renders a green dot indicator.
 *
 * @param className - Additional CSS classes to apply to the indicator. Defaults to an empty string.
 */
export default function Indicator({ className = '' }: IndicatorProps) {
  return <span className={`bg-indicator h-3 w-3 rounded-full ${className}`} />;
}
