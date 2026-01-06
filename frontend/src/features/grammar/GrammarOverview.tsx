import { useState, useCallback } from "react";
import Grammar from "@/database/models/grammar";
import UserItem from "@/database/models/user-items";
import type { GrammarLocal } from "@/types/local.types";
import ListOverview from "./ListOverview";
import OverviewCard from "@/components/UI/OverviewCard";
import { useFetch } from "@/hooks/use-fetch";
import { useAuthStore } from "@/features/auth/use-auth-store";
import DOMPurify from "dompurify";
import HelpButton from "@/features/overlay/HelpButton";

/**
 * GrammarOverview component displays a list of started grammar topics for the user.
 *
 * @returns A view with a grammar list and detail card, including progress reset and help features.
 */
export default function GrammarOverview() {
  const { userId } = useAuthStore();

  const fetchGrammarList = useCallback(async () => {
    if (userId) {
      return await Grammar.getStartedGrammarList(userId);
    }
    return [];
  }, [userId]);

  const {
    data: grammarArray,
    error,
    loading,
    setShouldReload,
  } = useFetch<GrammarLocal[]>(fetchGrammarList);

  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleClearGrammarUserItems = async () => {
    const grammar_id = grammarArray?.[currentIndex]?.id;
    if (typeof grammar_id === "number" && userId) {
      await UserItem.resetGrammarItems(userId, grammar_id);
      setShouldReload(true);
    }
  };

  return (
    <>
      {!cardVisible ? (
        <ListOverview
          listTitle="Přehled gramatiky"
          emptyTitle="Žádné započatá gramatika"
          array={grammarArray}
          loading={loading}
          error={error}
          onSelect={(index) => {
            setCurrentIndex(index);
            setCardVisible(true);
          }}
          onClose={() => window.history.back()}
        />
      ) : (
        <div className="relative flex flex-col w-full grow items-center justify-start">
          <OverviewCard
            titleText={grammarArray?.[currentIndex].name}
            onClose={() => setCardVisible(false)}
            handleReset={handleClearGrammarUserItems}
          >
            {grammarArray?.[currentIndex].note ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(grammarArray[currentIndex].note),
                }}
              />
            ) : (
              "Žádné poznámky k zobrazení."
            )}
          </OverviewCard>
          <HelpButton className="self-end" />
        </div>
      )}
    </>
  );
}
