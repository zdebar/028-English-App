import { useState, useEffect } from "react";
import ButtonRectangular from "./button-rectangular";
import Grammar from "@/database/models/grammar";
import type { GrammarLocal } from "@/types/local.types";
import { CloseIcon } from "./icons";

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
    <div className="card-height card-width flex flex-col gap-1 justify-start">
      <div className="h-button flex items-center justify-between gap-1">
        <p className="border h-button grow border-dashed flex items-center justify-between gap-1 px-4">
          {error ? error : grammarContent?.name || "Loading..."}
        </p>
        <ButtonRectangular className="w-button grow-0" onClick={onClose}>
          <CloseIcon />
        </ButtonRectangular>
      </div>
      <p className=" border border-dashed w-full grow p-4">
        {grammarContent?.note}
      </p>
    </div>
  );
}
