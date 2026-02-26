import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import PlusIcon from '@/components/UI/icons/PlusIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { type PracticeButtonProps } from '../practice.types';

export default function KnownButton({ onClick, disabled, children }: PracticeButtonProps) {
  return (
    <ButtonRectangular onClick={onClick} disabled={disabled} className="relative">
      <PlusIcon />
      <HelpText className="-top-4.5 right-2">{TEXTS.known}</HelpText>
      {children}
    </ButtonRectangular>
  );
}
