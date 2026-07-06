import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import type { ButtonHTMLAttributes, JSX } from 'react';

type MasteredToggleButtonProps = Readonly<{
  /** Current dashboard mode: false shows started counts, true shows mastered counts. */
  showMastered: boolean;
  /** Receives the next dashboard mode when the toggle is clicked. */
  setShowMastered: (value: boolean) => void;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

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
