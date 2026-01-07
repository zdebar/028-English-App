import OverviewCard from '@/components/UI/OverviewCard';
import DOMPurify from 'dompurify';

export interface GrammarCardType {
  id: number;
  name: string;
  note?: string;
}

/**
 * GrammarCard component displays details and notes for a selected grammar topic.
 *
 * @param grammar The grammar topic to display (id, name, and optional note).
 * @param onClose Function called to close the card.
 * @returns An OverviewCard with the grammar name and sanitized notes, or a message if no notes are available.
 */
export default function GrammarCard({
  grammar,
  onClose,
}: {
  grammar?: GrammarCardType | null;
  onClose: () => void;
}) {
  return (
    <OverviewCard titleText={grammar?.name} onClose={onClose}>
      {grammar?.note ? (
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(grammar.note),
          }}
        />
      ) : (
        'Žádné poznámky k zobrazení.'
      )}
    </OverviewCard>
  );
}
