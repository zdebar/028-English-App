import RepeatIcon from '@/components/UI/icons/RepeatIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import PracticeButton from './PracticeButton';

export default function RepeatButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <PracticeButton
      icon={<RepeatIcon />}
      label={TEXTS.repeat}
      helpSide="left"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </PracticeButton>
  );
}
