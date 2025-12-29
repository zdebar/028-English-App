import OverviewCard from "@/components/UI/OverviewCard";
import DOMPurify from "dompurify";

export interface GrammarCardType {
  id: number;
  name: string;
  note?: string;
}

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
        "Žádné poznámky k zobrazení."
      )}
    </OverviewCard>
  );
}
