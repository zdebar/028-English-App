import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import PlayIcon from '@/components/UI/icons/PlayIcon';
import { TEXTS } from '@/locales/cs';

type PlayButtonProps = Readonly<{
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}>;

export default function PlayButton({ onClick, disabled = false, className = '' }: PlayButtonProps) {
  return (
    <SecondaryControlButton
      onClick={onClick}
      disabled={disabled}
      title={TEXTS.audio}
      ariaLabel={TEXTS.audio}
      className={className}
    >
      <PlayIcon />
    </SecondaryControlButton>
  );
}
