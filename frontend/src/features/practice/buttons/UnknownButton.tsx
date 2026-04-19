import BaseButton from '@/components/UI/buttons/BaseButton';
import MinusIcon from '@/components/UI/icons/MinusIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function UnknownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <>
      <BaseButton
        onClick={onClick}
        disabled={disabled}
        className="h-button relative"
        title={!disabled ? TEXTS.unknown : undefined}
      >
        <MinusIcon />

        {children}
      </BaseButton>
      <HelpText className="-top-4.5 left-4">{TEXTS.unknown}</HelpText>
    </>
  );
}
