import PlayIcon from '@/components/UI/icons/PlayIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import PracticeButton from './PracticeButton';

export default function PlayAudioButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <PracticeButton
      icon={<PlayIcon />}
      label={TEXTS.audio}
      helpSide="right"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </PracticeButton>
  );
}
