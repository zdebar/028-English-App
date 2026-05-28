import InfoIcon from '@/components/UI/icons/InfoIcon';
import HelpText from '@/features/help/HelpText';
import type { MouseEvent } from 'react';

type NoteButtonProps = Readonly<{
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  title: string;
  className?: string;
}>;

export default function NoteButton({ onClick, title, className = '' }: NoteButtonProps) {
  return (
    <button
      type="button"
      aria-label="note"
      title={title}
      onClick={onClick}
      className={`note-btn-pos absolute mr-2 cursor-pointer self-end p-4 ${className}`}
    >
      <InfoIcon />
      <HelpText className="top-0 left-4 flex flex-col items-end">{title}</HelpText>
    </button>
  );
}
