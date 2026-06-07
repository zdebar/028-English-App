import OverviewCard from '@/components/UI/OverviewCard';
import DOMPurify from 'dompurify';
import { TEXTS } from '@/locales/cs';

export interface SimpleOverviewCardType {
  id: number;
  name: string;
  note?: string;
}

type SimpleOverviewCardProps = Readonly<{
  data?: SimpleOverviewCardType | null;
  onClose: () => void;
}>;

/**
 * SimpleOverviewCard component displays details and notes for a selected item.
 *
 * @param data The item to display (id, name, and optional note).
 * @param onClose Function called to close the card.
 * @returns An OverviewCard with the item name and sanitized notes, or a message if no notes are available.
 */
export default function SimpleOverviewCard({ data, onClose }: SimpleOverviewCardProps) {
  return (
    <OverviewCard buttonTitle={data?.name} onClose={onClose}>
      {data?.note ? (
        <div
          className="grammar p-4"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.note) }}
        />
      ) : (
        TEXTS.noNotesToDisplay
      )}
    </OverviewCard>
  );
}
