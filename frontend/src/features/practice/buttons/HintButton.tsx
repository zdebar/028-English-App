import StyledButton from '@/components/UI/buttons/StyledButton';
import BulbIcon from '@/components/UI/icons/BulbIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function HintButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <>
      <StyledButton
        onClick={onClick}
        disabled={disabled}
        className="h-button relative"
        title={disabled ? undefined : TEXTS.hint}
      >
        <BulbIcon />
        {children}
      </StyledButton>
      <HelpText className="-top-4.5 right-4">{TEXTS.hint}</HelpText>
    </>
  );
}
