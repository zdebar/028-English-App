import RightArrowIcon from '@/components/UI/icons/RightArrowIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import PracticeButton from './PracticeButton';

export default function KnownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <PracticeButton
      icon={<RightArrowIcon />}
      label={TEXTS.known}
      className="help-bottom-right"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </PracticeButton>
  );
}
