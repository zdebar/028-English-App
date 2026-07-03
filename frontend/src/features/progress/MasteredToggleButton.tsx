import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import type { ButtonHTMLAttributes, JSX } from 'react';

type MasteredToggleButtonProps = Readonly<{
  showMastered: boolean;
  setShowMastered: (value: boolean) => void;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A styled button component for toggling mastered state.
 *
 * @param showMastered - Indicates whether mastered items are currently shown
 * @param setShowMastered - Function to update the mastered state
 */
export default function MasteredToggleButton({
  showMastered,
  setShowMastered,
  ...rest
}: MasteredToggleButtonProps): JSX.Element {
  return (
    <>
      <button
        type="button"
        className={`mastered-toggle-button h-button inline-flex cursor-pointer items-center justify-center rounded-full px-4 ${rest.className ?? ''}`}
        onClick={() => setShowMastered(!showMastered)}
        title={TEXTS.masteredSwitchHelp}
      >
        {showMastered ? TEXTS.masteredCount : TEXTS.startedCount}
      </button>
      <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp} </HelpText>
    </>
  );
}
