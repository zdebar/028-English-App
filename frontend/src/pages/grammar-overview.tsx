import { useState, useCallback } from "react";
import ButtonRectangular from "../components/UI/button-rectangular";
import Grammar from "@/database/models/grammar";
import UserItem from "@/database/models/user-items";
import type { GrammarLocal } from "@/types/local.types";
import { CloseIcon } from "../components/UI/icons";
import { useNavigate } from "react-router-dom";
import OverviewCard from "@/components/UI/overview-card";
import { useFetch } from "@/hooks/use-fetch";
import { useAuthStore } from "@/hooks/use-auth-store";
import DOMPurify from "dompurify";

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
    setReload,
  } = useFetch<GrammarLocal[]>(fetchGrammarList);
  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const handleClearGrammarUserItems = async () => {
    const grammar_id = grammarArray?.[currentIndex]?.id;
    if (typeof grammar_id === "number" && userId) {
      await UserItem.resetGrammarItems(userId, grammar_id);
      setReload(true);
    }
  };

  return (
    <>
      {!cardVisible ? (
        <div className="card-width flex flex-col gap-1 justify-start">
          <div className="h-button flex items-center justify-between gap-1">
            <div className="flex h-button grow justify-start p-4 border border-dashed">
              {loading ? "Načítání..." : error || "Přehled gramatiky"}
            </div>
            <ButtonRectangular
              className="w-button grow-0"
              onClick={() => navigate("/profile")}
            >
              <CloseIcon />
            </ButtonRectangular>
          </div>
          {grammarArray && grammarArray.length > 0 ? (
            grammarArray.map((grammar, index) => (
              <ButtonRectangular
                key={grammar.id}
                className="text-left h-input flex justify-start p-4"
                onClick={() => {
                  setCurrentIndex(index);
                  setCardVisible(true);
                }}
              >
                {`${index + 1} : ${grammar.name} `}
              </ButtonRectangular>
            ))
          ) : (
            <p className="text-left h-input flex justify-start p-4">
              Žádná započatá gramatika
            </p>
          )}
        </div>
      ) : (
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
      )}
    </>
  );
}
