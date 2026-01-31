import QuestionMarkIcon from '@/components/UI/icons/QuestionMarkIcon';
import { useHelpStore } from './use-help-store';
import type { JSX } from 'react';

/**
 * Help button component that opens the help overlay.
 *
 * @param className Additional CSS classes for custom styling.
 * @return The rendered help button element.
 */
export default function HelpButton({ className = '' }: { className?: string }): JSX.Element {
  const openHelp = useHelpStore((state) => state.openHelp);

  return (
    <button type="button" className={`absolute p-2 ${className}`} onClick={openHelp}>
      <QuestionMarkIcon />
    </button>
  );
}
