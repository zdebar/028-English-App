interface IndicatorProps {
  showDot?: boolean;
  className?: string;
}

export default function Indicator({ showDot = false, className = '' }: IndicatorProps) {
  return (
    <div className={`${className}`}>
      {showDot && <span className={`h-3 w-3 rounded-full bg-green-500`} aria-label="New" />}
    </div>
  );
}
