import BookIcon from '@/components/UI/icons/BookIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import PracticeButton from './PracticeButton';

export default function GrammarButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <PracticeButton
      icon={<BookIcon />}
      label={TEXTS.grammar}
      helpSide="left"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </PracticeButton>
  );
}
