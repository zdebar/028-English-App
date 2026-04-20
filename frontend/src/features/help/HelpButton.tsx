import QuestionMarkIcon from '@/components/UI/icons/QuestionMarkIcon';
import { useHelpStore } from './use-help-store';
import type { JSX } from 'react';
import { TEXTS } from '@/locales/cs';

type HelpButtonProps = {
  className?: string;
};

/**
 * Help button component that opens the help overlay.
 *
 * @param className Additional CSS classes for custom styling.
 * @return The rendered help button element.
 */
export default function HelpButton({ className = '' }: HelpButtonProps): JSX.Element {
  const openHelp = useHelpStore((state) => state.openHelp);
  const buttonClassName = `absolute p-4 cursor-pointer ${className}`;

  return (
    <button type="button" className={buttonClassName} onClick={openHelp} title={TEXTS.tooltipHelp}>
      <QuestionMarkIcon />
    </button>
  );
}
