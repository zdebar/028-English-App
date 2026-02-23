import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import EyeIcon from '@/components/UI/icons/EyeIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function RevealButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ButtonRectangular onClick={onClick} disabled={disabled} className="relative">
      <EyeIcon />
      <HelpText className="-top-4.5 right-3.5">{TEXTS.reveal}</HelpText>
      {children}
    </ButtonRectangular>
  );
}
