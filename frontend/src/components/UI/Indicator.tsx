interface IndicatorProps {
  color?: string;
  className?: string;
}

/**
 * A component that renders a dot indicator.
 *
 * @param color - Optional color for the indicator. Defaults to the theme's indicator color. Use CSS classes.
 * @param className - Additional CSS classes to apply to the indicator. Defaults to an empty string.
 */
export default function Indicator({ color = 'bg-indicator', className = '' }: IndicatorProps) {
  return <span className={`h-indicator w-indicator rounded-full ${color} ${className}`} />;
}
