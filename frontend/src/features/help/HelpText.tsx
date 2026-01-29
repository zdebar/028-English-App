import { useHelpStore } from './use-help-store';

interface HelpTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * HelpText component for displaying contextual hints.
 *
 * @param children Content to be displayed inside the hint.
 * @param className Additional CSS classes for custom styling.
 */
export default function HelpText({ children, className = '' }: HelpTextProps) {
  const isHelpOpened = useHelpStore((state) => state.isHelpOpened);

  if (!isHelpOpened) return null;

  return (
    <div
      className={`font-headings text-hint z-help-text pointer-events-none absolute text-center text-xl ${className}`}
    >
      {children}
    </div>
  );
}
