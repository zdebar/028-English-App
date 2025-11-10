import Grammar from "@/database/models/grammar";
import OverviewCard from "@/components/UI/overview-card";
import "react-toastify/dist/ReactToastify.css";
import { useFetch } from "@/hooks/user-fetch";

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
  const {
    data: grammar,
    error,
    isLoading,
  } = useFetch(() => Grammar.getGrammarById(grammar_id!));

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
