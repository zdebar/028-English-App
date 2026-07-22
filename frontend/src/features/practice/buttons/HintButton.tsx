import BulbIcon from '@/components/UI/icons/BulbIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import ControlButton from './ControlButton';

export default function HintButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ControlButton
      icon={<BulbIcon />}
      label={TEXTS.hint}
      className="pos-help-top-right"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ControlButton>
  );
}
