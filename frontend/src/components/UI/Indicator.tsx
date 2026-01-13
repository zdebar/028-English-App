interface IndicatorProps {
  showDot?: boolean;
  className?: string;
}

/**
 * A component that renders an indicator, optionally displaying a green dot.
 * @param showDot - If true, displays a small green dot inside the indicator. Defaults to false.
 * @param className - Additional CSS classes to apply to the indicator container. Defaults to an empty string.
 */
export default function Indicator({ showDot = false, className = '' }: IndicatorProps) {
  return (
    <div className={`${className}`}>
      {showDot && <span className={`h-3 w-3 rounded-full bg-green-500`} />}
    </div>
  );
}
