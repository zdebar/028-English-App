import { useState, useEffect } from "react";
import Grammar from "@/database/models/grammar";
import type { GrammarLocal } from "@/types/local.types";
import OverviewCard from "./overview-card";

interface GrammarCardProps {
  grammar_id: number | null;
  onClose: () => void;
}

export default function GrammarCard({ grammar_id, onClose }: GrammarCardProps) {
  const [grammar, setGrammar] = useState<GrammarLocal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGrammar() {
      try {
        const fetchedContent = await Grammar.getGrammarById(grammar_id!);
        setGrammar(fetchedContent || null);
      } catch (error) {
        setError("Chyba při načítání gramatiky.");
        console.error("Failed to fetch grammar content.", error);
      }
    }

    if (grammar_id) {
      fetchGrammar();
    }
  }, [grammar_id]);

  return (
    <OverviewCard
      titleText={error ? error : grammar?.name}
      bodyText={grammar?.note}
      onClose={onClose}
    />
  );
}
