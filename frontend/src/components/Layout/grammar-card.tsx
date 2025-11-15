import Grammar from "@/database/models/grammar";
import OverviewCard from "@/components/UI/overview-card";
import { useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import DOMPurify from "dompurify";

/**
 * Fetches and display individual grammar content by grammar_id in a card.
 * @param grammar_id - The ID of the grammar to display.
 * @param onClose - Callback function to close the grammar card.
 */
export default function GrammarCard({
  grammar_id,
  onClose,
}: {
  grammar_id: number;
  onClose: () => void;
}) {
  const fetchGrammar = useCallback(() => {
    return Grammar.getGrammarById(grammar_id);
  }, [grammar_id]);

  const { data: grammar, error, loading } = useFetch(fetchGrammar);

  return (
    <OverviewCard
      titleText={grammar?.name}
      onClose={onClose}
      isLoading={loading}
      error={error}
    >
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
