import InfoIcon from '@/components/UI/icons/InfoIcon';
import HelpText from '@/features/help/HelpText';
import * as LOCALES from '@/locales/cs';
import type { MouseEvent } from 'react';

type NoteButtonProps = Readonly<{
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  title: string;
  className?: string;
}>;

export default function NoteButton({ onClick, title, className = '' }: NoteButtonProps) {
  const noteAriaLabel = LOCALES.ARIA_TEXTS?.note ?? 'note';

  return (
    <button
      type="button"
      aria-label={noteAriaLabel}
      title={title}
      onClick={onClick}
      className={`note-btn-pos absolute mr-2 cursor-pointer self-end p-4 ${className}`}
    >
      <InfoIcon />
      <HelpText className="top-3 left-12 flex flex-col items-end">{title}</HelpText>
    </button>
  );
}
