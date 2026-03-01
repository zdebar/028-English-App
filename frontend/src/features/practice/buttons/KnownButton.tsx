import BaseButton from '@/components/UI/buttons/BaseButton';
import PlusIcon from '@/components/UI/icons/PlusIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function KnownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <BaseButton onClick={onClick} disabled={disabled} className="relative">
      <PlusIcon />
      <HelpText className="-top-4.5 right-4">{TEXTS.known}</HelpText>
      {children}
    </BaseButton>
  );
}
