import BaseButton from '@/components/UI/buttons/BaseButton';
import BulbIcon from '@/components/UI/icons/BulbIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function HintButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <BaseButton onClick={onClick} disabled={disabled} className="h-button relative">
      <BulbIcon />
      <HelpText className="-top-4.5 right-4">{TEXTS.hint}</HelpText>
      {children}
    </BaseButton>
  );
}
