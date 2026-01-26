interface HelpTextProps {
  visible: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * HelpText component for displaying contextual hints.
 *
 * @param children Content to be displayed inside the hint.
 * @param className Additional CSS classes for custom styling.
 */
export default function HelpText({ visible, children, className = '' }: HelpTextProps) {
  if (!visible) return null;

  return (
    <div
      className={`font-headings text-hint z-help-text pointer-events-none absolute text-center text-xl ${className}`}
    >
      {children}
    </div>
  );
}
