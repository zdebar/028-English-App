import { useState, useEffect } from "react";
import Grammar from "@/database/models/grammar";
import type { GrammarLocal } from "@/types/local.types";
import OverviewCard from "@/components/UI/overview-card";
import "react-toastify/dist/ReactToastify.css";

/**
 * Fetches and display individual grammar content by grammar_id in a card.
 * @param grammar_id - The ID of the grammar to display.
 * @param onClose - Callback function to close the grammar card.
 * @returns
 */
export default function GrammarCard({
  grammar_id,
  onClose,
}: {
  grammar_id: number | null;
  onClose: () => void;
}) {
  const [grammar, setGrammar] = useState<GrammarLocal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchGrammar() {
      if (!grammar_id) {
        console.error("Invalid grammar ID.");
        return;
      }

      setIsLoading(true);
      try {
        const fetchedContent = await Grammar.getGrammarById(grammar_id!);
        setGrammar(fetchedContent || null);
      } catch (error) {
        setError("Chyba při načítání gramatiky.");
        console.error("Failed to fetch grammar content.", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (grammar_id) {
      fetchGrammar();
    }
  }, [grammar_id]);

  return (
    <OverviewCard titleText={error ? error : grammar?.name} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : error ? (
        <p>{error}</p>
      ) : grammar?.note ? (
        grammar.note
      ) : (
        <p>Žádné poznámky k zobrazení.</p>
      )}
    </OverviewCard>
  );
}
