import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import InfoIcon from '@/components/UI/icons/InfoIcon';
import { ARIA_TEXTS } from '@/locales/cs';
import type { MouseEvent } from 'react';

type InfoButtonProps = Readonly<{
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  title: string;
  children?: React.ReactNode;
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
