import BookIcon from '@/components/UI/icons/BookIcon';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';
import ControlButton from './ControlButton';

export default function GrammarButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ControlButton
      icon={<BookIcon />}
      label={TEXTS.grammar}
      className="pos-help-top-left"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ControlButton>
  );
}
