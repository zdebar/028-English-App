interface HintProps {
  visible: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Hint component for displaying contextual hints.
 *
 * @param visible Whether the hint is visible.
 * @param children Content to be displayed inside the hint.
 * @param className Additional CSS classes for custom styling.
 */
export default function Hint({ visible, children, className = '' }: HintProps) {
  if (!visible) return null;

  return (
    <div
      className={`font-headings text-hint z-hint pointer-events-none absolute text-center text-xl ${className}`}
    >
      {children}
    </div>
  );
}
