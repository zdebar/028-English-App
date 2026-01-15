type HintProps = {
  visible: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Hint component for displaying contextual hints.
 *
 * @param visible Whether the hint is visible.
 * @param children Content to be displayed inside the hint.
 * @param className Additional CSS classes for custom styling.
 * @param style Inline styles for the hint container.
 */
export default function Hint({ visible, children, className = '', style }: HintProps) {
  return visible ? (
    <div
      className={`font-headings text-hint pointer-events-none absolute z-2000 text-center text-xl ${className}`}
      style={style}
    >
      {children}
    </div>
  ) : null;
}
