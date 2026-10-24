import ForwardIcon from '@/components/UI/icons/ForwardIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import ControlButton from './ControlButton';

export default function KnownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ControlButton
      icon={<ForwardIcon />}
      label={TEXTS.known}
      className="pos-help-top-left"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ControlButton>
  );
}
