import BaseButton from '@/components/UI/buttons/BaseButton';
import RepeatIcon from '@/components/UI/icons/RepeatIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function RepeatButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <>
      <BaseButton
        onClick={onClick}
        disabled={disabled}
        className="h-button relative"
        title={disabled ? undefined : TEXTS.repeat}
      >
        <RepeatIcon />

        {children}
      </BaseButton>
      <HelpText className="-top-4.5 left-4">{TEXTS.repeat}</HelpText>
    </>
  );
}
