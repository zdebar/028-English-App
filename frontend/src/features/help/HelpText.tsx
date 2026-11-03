import { useHelpStore } from './use-help-store';
import type { HTMLAttributes, JSX } from 'react';

/**
 * HelpText component for displaying contextual hints.
 * Manages visibility based on the help store 'isHelpOpened' state.
 */
export default function HelpText(
  props: Readonly<HTMLAttributes<HTMLParagraphElement>>,
): JSX.Element | null {
  const { children, className = '', ...paragraphProps } = props;
  const isHelpOpened = useHelpStore((state) => state.isHelpOpened);

  if (!isHelpOpened) {
    return null;
  }

  return (
    <p
      {...paragraphProps}
      className={`font-headings z-help-text pointer-events-none absolute overflow-hidden px-2 text-xl font-bold text-ellipsis whitespace-nowrap text-help ${className}`}
    >
      {children}
    </p>
  );
}
