import BulbIcon from '@/components/UI/icons/BulbIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import PracticeButton from './PracticeButton';

export default function HintButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <PracticeButton
      icon={<BulbIcon />}
      label={TEXTS.hint}
      className="help-bottom-right"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </PracticeButton>
  );
}
