import StyledButton from '@/components/UI/buttons/StyledButton';
import BookIcon from '@/components/UI/icons/BookIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function GrammarButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <>
      <StyledButton
        onClick={onClick}
        disabled={disabled}
        className="h-button relative"
        title={disabled ? undefined : TEXTS.grammar}
      >
        <BookIcon />
        {children}
      </StyledButton>
      <HelpText className="-top-4.5 left-4">{TEXTS.grammar}</HelpText>
    </>
  );
}
