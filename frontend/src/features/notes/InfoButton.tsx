import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import InfoIcon from '@/components/UI/icons/InfoIcon';
import { ARIA_TEXTS } from '@/locales/cs';
import type { MouseEvent, ReactNode } from 'react';

type InfoButtonProps = Readonly<{
  /** Click handler receives the original button event so callers can stop propagation. */
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Tooltip text for the button; aria label comes from localized note text. */
  title: string;
  /** Optional inline label rendered after the info icon. */
  children?: ReactNode;
  /** Extra classes appended to the secondary control button. */
  className?: string;
  disabled?: boolean;
}>;

export default function InfoButton({
  onClick,
  title,
  className = '',
  disabled = false,
  children,
}: InfoButtonProps) {
  return (
    <SecondaryControlButton
      aria-label={ARIA_TEXTS.note}
      title={title}
      onClick={onClick}
      className={className}
      disabled={disabled}
    >
      <InfoIcon />
      {children}
    </SecondaryControlButton>
  );
}
