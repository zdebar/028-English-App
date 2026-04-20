import BaseButton from '@/components/UI/buttons/BaseButton';
import RightArrowIcon from '@/components/UI/icons/RightArrowIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function KnownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <>
      <BaseButton
        onClick={onClick}
        disabled={disabled}
        className="h-button relative"
        title={!disabled ? TEXTS.known : undefined}
      >
        <RightArrowIcon />
        {children}
      </BaseButton>
      <HelpText className="-top-4.5 right-4">{TEXTS.known}</HelpText>
    </>
  );
}
