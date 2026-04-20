import { useHelpStore } from './use-help-store';
import type { JSX, ReactNode } from 'react';

interface HelpTextProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * HelpText component for displaying contextual hints.
 * Manages visibility based on the help store 'isHelpOpened' state.
 *
 * @param children Content to be displayed inside the help.
 * @param className Additional CSS classes for custom styling.
 * @return The rendered help text element or null if help is closed.
 */
export default function HelpText({ children, className = '' }: HelpTextProps): JSX.Element | null {
  const isHelpOpened = useHelpStore((state) => state.isHelpOpened);

  if (!isHelpOpened) {
    return null;
  }
  
  return (
    <p
      className={`font-headings z-help-text pointer-events-none absolute px-2 text-xl font-bold ${className}`}
    >
      {children}
    </p>
  );
}
