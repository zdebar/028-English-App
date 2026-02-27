import ButtonWithModal from '@/features/modal/ButtonWithModal';
import ForwardIcon from '@/components/UI/icons/ForwardIcon';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';

type SkipButtonProps = {
  onConfirm: () => void;
  disabled: boolean;
  children?: React.ReactNode;
};

export default function SkipButton({ onConfirm, disabled, children }: SkipButtonProps) {
  return (
    <ButtonWithModal
      modalTitle={TEXTS.skipTitle}
      modalText={TEXTS.skipText}
      onConfirm={onConfirm}
      disabled={disabled}
      className="relative"
    >
      <ForwardIcon />
      <HelpText className="-top-4.5 left-4">{TEXTS.complete}</HelpText>
      {children}
    </ButtonWithModal>
  );
}
