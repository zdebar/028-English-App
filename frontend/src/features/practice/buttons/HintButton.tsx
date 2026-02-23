import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import BulbIcon from '@/components/UI/icons/BulbIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function HintButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ButtonRectangular onClick={onClick} disabled={disabled} className="relative">
      <BulbIcon />
      <HelpText className="-top-4.5 right-3.5">{TEXTS.hint}</HelpText>
      {children}
    </ButtonRectangular>
  );
}
