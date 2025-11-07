import { useState, useEffect } from "react";
import ButtonRectangular from "../components/button-rectangular";
import Grammar from "@/database/models/grammar";
import UserItem from "@/database/models/user-items";
import type { GrammarLocal } from "@/types/local.types";
import { CloseIcon } from "../components/icons";
import { useNavigate } from "react-router-dom";
import OverviewCard from "@/components/overview-card";

export default function GrammarOverview() {
  const [grammarArray, setGrammarArray] = useState<GrammarLocal[] | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchGrammarArray = async () => {
    try {
      const fetchedContent = await Grammar.getStartedGrammarList();
      setGrammarArray(fetchedContent);
      console.log("Fetched grammar content:", fetchedContent);
    } catch (error) {
      setError("Chyba při načítání gramatiky.");
      console.error("Failed to fetch grammar content.", error);
    }
  };

  useEffect(() => {
    fetchGrammarArray();
  }, []);

  const handleClearGrammarUserItems = async () => {
    const id = grammarArray?.[currentIndex]?.id;
    if (typeof id === "number") {
      UserItem.clearGrammarItems(id);
      await fetchGrammarArray();
    }
  };

  return (
    <>
      {!cardVisible ? (
        <div className="card-width flex flex-col gap-1 justify-start">
          <div className="h-button flex items-center justify-between gap-1">
            <div className="flex h-button grow justify-start p-4 border border-dashed">
              {error || "Přehled gramatiky"}
            </div>
            <ButtonRectangular
              className="w-button grow-0"
              onClick={() => navigate("/profile")}
            >
              <CloseIcon />
            </ButtonRectangular>
          </div>
          {grammarArray?.map((grammar, index) => (
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
          )) || (
            <p className="text-left h-input flex justify-start p-4">
              Žádná započatá gramatika
            </p>
          )}
        </div>
      ) : (
        <OverviewCard
          titleText={grammarArray?.[currentIndex].name}
          bodyText={grammarArray?.[currentIndex].note}
          onClose={() => setCardVisible(false)}
          handleReset={handleClearGrammarUserItems}
        />
      )}
    </>
  );
}
