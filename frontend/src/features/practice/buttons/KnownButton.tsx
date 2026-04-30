import StyledButton from '@/components/UI/buttons/StyledButton';
import RightArrowIcon from '@/components/UI/icons/RightArrowIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function KnownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <>
      <StyledButton
        onClick={onClick}
        disabled={disabled}
        className="h-button relative"
        title={disabled ? undefined : TEXTS.known}
      >
        <RightArrowIcon />
        {children}
      </StyledButton>
      <HelpText className="-top-4.5 right-4">{TEXTS.known}</HelpText>
    </>
  );
}
