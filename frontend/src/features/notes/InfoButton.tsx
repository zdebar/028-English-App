import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import InfoIcon from '@/components/UI/icons/InfoIcon';
import { ARIA_TEXTS } from '@/locales/cs';
import type { MouseEvent } from 'react';

type InfoButtonProps = Readonly<{
  /** Click handler receives the original button event so callers can stop propagation. */
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Tooltip text for the button; aria label comes from localized note text. */
  title: string;
  /** Optional inline label rendered after the info icon. */
  children?: React.ReactNode;
  /** Extra classes appended to the secondary control button. */
  className?: string;
}>;

export default function InfoButton({ onClick, title, className = '', children }: InfoButtonProps) {
  const noteAriaLabel = ARIA_TEXTS?.note ?? 'note';

  return (
    <SecondaryControlButton
      ariaLabel={noteAriaLabel}
      title={title}
      onClick={onClick}
      className={className}
    >
      <InfoIcon />
      {children}
    </SecondaryControlButton>
  );
}
