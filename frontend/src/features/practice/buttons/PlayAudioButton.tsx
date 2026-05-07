import StyledButton from '@/components/UI/buttons/StyledButton';
import PlayIcon from '@/components/UI/icons/PlayIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function PlayAudioButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <>
      <StyledButton
        onClick={onClick}
        disabled={disabled}
        className="h-button relative"
        title={disabled ? undefined : TEXTS.audio}
      >
        <PlayIcon />

        {children}
      </StyledButton>
      <HelpText className="-top-4.5 right-4">{TEXTS.audio}</HelpText>
    </>
  );
}
