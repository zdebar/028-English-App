import { useState, useEffect } from "react";
import ButtonRectangular from "./button-rectangular";
import Grammar from "@/database/models/grammar";
import type { GrammarLocal } from "@/types/local.types";

interface GrammarCardProps {
  grammar_id: number | null;
  onClose: () => void;
}

export default function GrammarCard({ grammar_id, onClose }: GrammarCardProps) {
  const [grammarContent, setGrammarContent] = useState<GrammarLocal | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGrammar() {
      try {
        const fetchedContent = await Grammar.getGrammarById(grammar_id!);
        setGrammarContent(fetchedContent || null);
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
    <div className="card-height card-width">
      <div className="w-full h-full flex flex-col gap-1">
        <div className="h-button border border-dashed flex flex-col justify-center p-4">
          {error ? (
            <p>{error}</p>
          ) : (
            <p>{grammarContent?.name || "Loading..."}</p>
          )}
        </div>
        <p className=" border border-dashed flex w-full h-full flex-col p-4">
          {grammarContent?.note}
        </p>
      </div>
      <ButtonRectangular onClick={onClose}>Zpět</ButtonRectangular>
    </div>
  );
}
