import RepeatIcon from '@/components/UI/icons/RepeatIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import ControlButton from './ControlButton';

export default function RepeatButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ControlButton
      icon={<RepeatIcon />}
      label={TEXTS.repeat}
      className="pos-help-top-left"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ControlButton>
  );
}
