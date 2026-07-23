import RightArrowIcon from '@/components/UI/icons/RightArrowIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import ControlButton from './ControlButton';

export default function KnownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ControlButton
      icon={<RightArrowIcon />}
      label={TEXTS.known}
      className="pos-help-top-right"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ControlButton>
  );
}
