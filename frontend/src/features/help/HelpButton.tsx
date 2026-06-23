import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import QuestionMarkIcon from '@/components/UI/icons/QuestionMarkIcon';
import { TEXTS } from '@/locales/cs';
import { useHelpStore } from './use-help-store';
import type { JSX } from 'react';

type HelpButtonProps = Readonly<{
  className?: string;
}>;

/**
 * Help button component that opens the help overlay.
 *
 * @param className Additional CSS classes for custom styling.
 * @return The rendered help button element.
 */
export default function HelpButton({ className = '' }: HelpButtonProps): JSX.Element {
  const openHelp = useHelpStore((state) => state.openHelp);

  return (
    <SecondaryControlButton
      className={`size-help-button ${className}`}
      onClick={openHelp}
      title={TEXTS.tooltipHelp}
      ariaLabel={TEXTS.tooltipHelp}
    >
      <QuestionMarkIcon />
    </SecondaryControlButton>
  );
}
