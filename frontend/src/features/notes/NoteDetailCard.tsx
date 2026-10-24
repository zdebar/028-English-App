import OverviewCard from '@/components/UI/OverviewCard';
import { TEXTS } from '@/locales/cs';
import SanitizedNote from '@/components/UI/SanitizedNote';

export type NoteDetail = Readonly<{
  id: number;
  name: string;
  note?: string;
}>;

type NoteDetailCardProps = Readonly<{
  note?: NoteDetail | null;
  onClose: () => void;
}>;

export default function NoteDetailCard({ note, onClose }: NoteDetailCardProps) {
  return (
    <OverviewCard buttonTitle={note?.name} onClose={onClose}>
      {note?.note ? (
        <SanitizedNote className="grammar p-4" html={note.note} />
      ) : (
        TEXTS.noNotesToDisplay
      )}
    </OverviewCard>
  );
}
