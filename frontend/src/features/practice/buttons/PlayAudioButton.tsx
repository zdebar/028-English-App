import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import PlayIcon from '@/components/UI/icons/PlayIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function PlayAudioButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ButtonRectangular onClick={onClick} disabled={disabled} className="relative">
      <PlayIcon />
      <HelpText className="-top-4.5 right-4">{TEXTS.audio}</HelpText>
      {children}
    </ButtonRectangular>
  );
}
