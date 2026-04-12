import BaseButton from '@/components/UI/buttons/BaseButton';
import BookIcon from '@/components/UI/icons/BookIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function GrammarButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      className="h-button relative"
      title={!disabled ? TEXTS.grammar : undefined}
    >
      <BookIcon />
      <HelpText className="-top-4.5 left-4">{TEXTS.grammar}</HelpText>
      {children}
    </BaseButton>
  );
}
