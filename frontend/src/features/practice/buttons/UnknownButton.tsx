import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import MinusIcon from '@/components/UI/icons/MinusIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function UnknownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ButtonRectangular onClick={onClick} disabled={disabled} className="relative">
      <MinusIcon />
      <HelpText className="-top-4.5 left-4">{TEXTS.unknown}</HelpText>
      {children}
    </ButtonRectangular>
  );
}
