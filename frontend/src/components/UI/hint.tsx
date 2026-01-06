/**
 * Hint component for displaying contextual hints.
 *
 * @param visibility Controls whether the hint is visible.
 * @param children Content to be displayed inside the hint.
 * @param className Additional CSS classes for custom styling.
 * @param style Inline styles for the hint.
 * @returns A styled hint element, or null if not visible.
 */
export default function Hint({
  visibility,
  children,
  className = "",
  style,
}: {
  visibility: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    visibility && (
      <div
        className={`text-help absolute z-2000 pointer-events-none ${className}`}
        style={{
          ...style,
        }}
      >
        {children}
      </div>
    )
  );
}
