import OverviewCard from '@/components/UI/OverviewCard';
import { TEXTS } from '@/locales/cs';
import SanitizedNote from '@/components/UI/SanitizedNote';
import type { NoteDetail } from './note.types';

type NoteDetailCardProps = Readonly<{
  note?: NoteDetail | null;
  onClose: () => void;
}>;

export default function NoteDetailCard({ note, onClose }: NoteDetailCardProps) {
  return (
    <OverviewCard buttonTitle={note?.name} onClose={onClose} showResetAction={false}>
      {note?.note ? (
        <SanitizedNote className="grammar p-4" html={note.note} />
      ) : (
        TEXTS.noNotesToDisplay
      )}
    </OverviewCard>
  );
}
