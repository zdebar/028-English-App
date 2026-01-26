interface IndicatorProps {
  className?: string;
  color?: string;
}

/**
 * A component that renders a dot indicator.
 *
 * @param className - Additional CSS classes to apply to the indicator. Defaults to an empty string.
 * @param color - Optional color for the indicator. Defaults to the theme's indicator color. Use CSS classes.
 */
export default function Indicator({ className = '', color = 'bg-indicator' }: IndicatorProps) {
  return <span className={`h-indicator w-indicator rounded-full ${className} ${color}`} />;
}
