import OverviewCard from '@/components/UI/OverviewCard';
import { TEXTS } from '@/locales/cs';
import DOMPurify from 'dompurify';

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
        <div
          className="grammar p-4"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.note) }}
        />
      ) : (
        TEXTS.noNotesToDisplay
      )}
    </OverviewCard>
  );
}
