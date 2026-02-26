import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import BookIcon from '@/components/UI/icons/BookIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function GrammarButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ButtonRectangular onClick={onClick} disabled={disabled} className="relative">
      <BookIcon />
      <HelpText className="-top-4.5 left-2">{TEXTS.grammar}</HelpText>
      {children}
    </ButtonRectangular>
  );
}
