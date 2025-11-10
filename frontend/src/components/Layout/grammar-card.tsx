import Grammar from "@/database/models/grammar";
import OverviewCard from "@/components/UI/overview-card";
import { useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";

/**
 * Fetches and display individual grammar content by grammar_id in a card.
 * @param grammar_id - The ID of the grammar to display.
 * @param onClose - Callback function to close the grammar card.
 */
export default function GrammarCard({
  grammar_id,
  onClose,
}: {
  grammar_id: number | null;
  onClose: () => void;
}) {
  const fetchGrammar = useCallback(() => {
    if (grammar_id !== null) {
      return Grammar.getGrammarById(grammar_id);
    }
    return Promise.reject("Invalid grammar ID");
  }, [grammar_id]);

  const { data: grammar, error, isLoading } = useFetch(fetchGrammar);

  return (
    <OverviewCard
      titleText={grammar?.name}
      onClose={onClose}
      isLoading={isLoading}
      error={error}
    >
      {grammar?.note || "Žádné poznámky k zobrazení."}
    </OverviewCard>
  );
}
