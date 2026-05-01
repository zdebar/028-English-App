import OverviewCard from '@/components/UI/OverviewCard';
import DOMPurify from 'dompurify';
import { TEXTS } from '@/locales/cs';

export interface GrammarCardType {
  id: number;
  name: string;
  note?: string;
}

type GrammarCardProps = Readonly<{
  grammar?: GrammarCardType | null;
  onClose: () => void;
}>;

/**
 * GrammarCard component displays details and notes for a selected grammar topic.
 *
 * @param grammar The grammar topic to display (id, name, and optional note).
 * @param onClose Function called to close the card.
 * @returns An OverviewCard with the grammar name and sanitized notes, or a message if no notes are available.
 */
export default function GrammarCard({ grammar, onClose }: GrammarCardProps) {
  return (
    <OverviewCard buttonTitle={grammar?.name} onClose={onClose}>
      {grammar?.note ? (
        <div
          className="grammar p-4"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(grammar.note) }}
        />
      ) : (
        TEXTS.noNotesToDisplay
      )}
    </OverviewCard>
  );
}
