import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';

type MasteredToggleButtonProps = Readonly<{
  showMastered: boolean;
  setShowMastered: (value: boolean) => void;
  className?: string;
}>;

/**
 * A styled button component for toggling mastered state.
 *
 * @param showMastered - Indicates whether mastered items are currently shown
 * @param setShowMastered - Function to update the mastered state
 * @param className - Additional CSS classes to apply to the button
 * @returns A button element with absolute positioning and info color styling
 */
export default function MasteredToggleButton({
  showMastered,
  setShowMastered,
  className = '',
}: MasteredToggleButtonProps) {
  const onClick = () => setShowMastered(!showMastered);

  return (
    <>
      <button
        type="button"
        className={`absolute -bottom-9 left-4 cursor-pointer ${className}`}
        onClick={onClick}
        title={TEXTS.masteredSwitchHelp}
      >
        {showMastered ? TEXTS.masteredCount : TEXTS.startedCount}
      </button>
      <HelpText className="-bottom-15 left-2">{TEXTS.masteredSwitchHelp} </HelpText>
    </>
  );
}
