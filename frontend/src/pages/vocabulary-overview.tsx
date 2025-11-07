import { useState, useEffect } from "react";
import ButtonRectangular from "../components/button-rectangular";

import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import { CloseIcon } from "../components/icons";
import { useNavigate } from "react-router-dom";
import OverviewCard from "@/components/overview-card";

export default function VocabularyOverview() {
  const [words, setWords] = useState<UserItemLocal[] | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchVocabularyArray = async () => {
    try {
      const fetchedContent = await UserItem.getUserStartedVocabulary();
      setWords(fetchedContent);
    } catch (error) {
      setError("Chyba při načítání slovíček.");
      console.error("Failed to fetch grammar content.", error);
    }
  };

  useEffect(() => {
    fetchVocabularyArray();
  }, []);

  const handleClearUserItem = async () => {
    const itemId = words?.[currentIndex]?.item_id;
    if (typeof itemId === "number") {
      UserItem.clearUserItem(itemId);
      await fetchVocabularyArray();
    }
  };

  return (
    <>
      {!cardVisible ? (
        <div className="card-width relative h-full overflow-y-scroll flex flex-col gap-1 justify-start">
          <div className="h-button flex items-center justify-between gap-1 sticky top-0 bg-background-light dark:bg-background-dark ">
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

          {words?.map((item, index) => (
            <ButtonRectangular
              key={item.item_id}
              className="text-left h-input flex justify-start p-4"
              onClick={() => {
                setCurrentIndex(index);
                setCardVisible(true);
              }}
            >
              {`${index + 1} : ${item.czech} / ${item.english} `}
            </ButtonRectangular>
          )) || (
            <p className="text-left h-input flex justify-start p-4">
              Žádná započatá gramatika
            </p>
          )}
        </div>
      ) : (
        <OverviewCard
          titleText={
            words?.[currentIndex].czech + " / " + words?.[currentIndex].english
          }
          bodyText={words?.[currentIndex].started_at || ""}
          onClose={() => setCardVisible(false)}
          handleReset={handleClearUserItem}
        />
      )}
    </>
  );
}
