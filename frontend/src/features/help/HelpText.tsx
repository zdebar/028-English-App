import { useHelpStore } from './use-help-store';
import type { JSX } from 'react';

interface HelpTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * HelpText component for displaying contextual hints.
 *
 * @param children Content to be displayed inside the help.
 * @param className Additional CSS classes for custom styling.
 * @return {JSX.Element | null} The rendered help text element or null if help is closed.
 */
export default function HelpText({ children, className = '' }: HelpTextProps): JSX.Element | null {
  const isHelpOpened = useHelpStore((state) => state.isHelpOpened);

  if (!isHelpOpened) return null;

  return (
    <div
      className={`font-headings text-help z-help-text pointer-events-none absolute px-4 text-xl ${className}`}
    >
      {children}
    </div>
  );
}
