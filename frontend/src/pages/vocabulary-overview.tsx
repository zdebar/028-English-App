import { useState, useEffect, useCallback } from "react";
import Button from "@/components/UI/buttons/Button";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import CloseIcon from "@/components/UI/icons/CloseIcon";
import { useNavigate } from "react-router-dom";
import OverviewCard from "@/components/UI/OverviewCard";
import DirectionDropdown from "@/components/UI/DirectionDropdown";
import PropertyView from "@/components/UI/PropertyView";
import { shortenDate } from "@/utils/database.utils";
import { useFetch } from "@/hooks/use-fetch";
import { useAuthStore } from "@/features/auth/use-auth-store";
import Loading from "@/components/UI/Loading";
import { getMoreText } from "@/utils/practice.utils";
import HelpButton from "@/components/UI/buttons/HelpButton";

export default function VocabularyOverview() {
  const { userId } = useAuthStore();

  const fetchVocabulary = useCallback(async () => {
    if (userId) {
      return await UserItem.getUserStartedVocabulary(userId);
    }
    return [];
  }, [userId]);

  const {
    data: words,
    error,
    loading,
    setReload,
  } = useFetch<UserItemLocal[]>(fetchVocabulary);

  const [filteredWords, setFilteredWords] = useState<UserItemLocal[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayField, setDisplayField] = useState<"czech" | "english">(
    "czech"
  );
  const navigate = useNavigate();
  const selectedWord = filteredWords ? filteredWords[currentIndex] : null;

  useEffect(() => {
    if (!words) return;
    const filtered = words
      .filter((item) =>
        item[displayField]?.toLowerCase().startsWith(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const lengthDiff = a[displayField]?.length - b[displayField].length;
        if (lengthDiff !== 0) return lengthDiff;
        return a[displayField].localeCompare(b[displayField]);
      });
    setFilteredWords(filtered);
  }, [words, searchTerm, displayField]);

  const visibleItems = filteredWords.slice(0, visibleCount);
  const remainingCount = filteredWords.length - visibleCount;

  const handleClearUserItem = async () => {
    const itemId = selectedWord?.item_id;
    if (typeof itemId === "number" && userId) {
      await UserItem.resetUserItemById(userId, itemId);
      setReload(true);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      {!cardVisible ? (
        <div className="card-width relative h-full flex flex-col gap-1 justify-start">
          <div className=" flex flex-col gap-1  bg-background-light dark:bg-background-dark">
            <div className="flex items-center justify-between gap-1">
              {error ? (
                <div className="flex h-button grow justify-start items-center border border-dashed">
                  {error}
                </div>
              ) : (
                <DirectionDropdown
                  value={displayField}
                  options={[
                    { value: "czech", label: "Čeština" },
                    { value: "english", label: "Angličtina" },
                  ]}
                  onChange={(value) =>
                    setDisplayField(value as "czech" | "english")
                  }
                  className="grow p-2 flex items-center border border-dashed h-button"
                />
              )}
              <Button
                className="w-button grow-0"
                onClick={() => navigate("/profile")}
              >
                <CloseIcon />
              </Button>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zadejte slovo..."
              className="h-input pl-4 border border-dashed bg-background-light dark:bg-background-dark"
            />
          </div>

          {/* Filtrovaná slova */}
          <div className="overflow-y-auto flex flex-col gap-1">
            {filteredWords && filteredWords.length > 0 ? (
              <>
                {visibleItems.map((item, index) => (
                  <Button
                    key={item.item_id}
                    className="text-left grow-0 h-input flex justify-start p-4"
                    onClick={() => {
                      setCurrentIndex(index);
                      setCardVisible(true);
                    }}
                  >
                    {displayField === "czech"
                      ? ` ${item.czech} `
                      : ` ${item.english} `}
                  </Button>
                ))}
                {remainingCount > 0 && (
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 8)}
                    className="mt-2 w-full text-center text-link"
                  >
                    ... a {remainingCount + " " + getMoreText(remainingCount)}
                  </button>
                )}
              </>
            ) : (
              <p className="text-left h-input flex justify-start pl-4">
                Žádná započatá slovíčka
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col w-full grow items-center justify-start">
          <OverviewCard
            titleText={selectedWord?.czech}
            onClose={() => setCardVisible(false)}
            handleReset={handleClearUserItem}
          >
            <div className="flex flex-col gap-4">
              <div>
                <PropertyView
                  label="item_id"
                  className="h-attribute"
                  value={selectedWord?.item_id}
                />
                <PropertyView
                  label="česky"
                  className="h-attribute"
                  value={selectedWord?.czech}
                />
                <PropertyView label="anglicky" value={selectedWord?.english} />
                <PropertyView
                  label="výslovnost"
                  className="h-attribute"
                  value={selectedWord?.pronunciation}
                />
                <PropertyView
                  label="pokrok"
                  className="h-attribute"
                  value={selectedWord?.progress}
                />
              </div>
              <div>
                <PropertyView
                  label="start"
                  className="h-attribute"
                  value={shortenDate(selectedWord?.started_at)}
                />
                <PropertyView
                  label="změněno"
                  className="h-attribute"
                  value={shortenDate(selectedWord?.updated_at)}
                />
                <PropertyView
                  label="další"
                  className="h-attribute"
                  value={shortenDate(selectedWord?.next_at)}
                />
                <PropertyView
                  label="naučeno"
                  className="h-attribute"
                  value={shortenDate(selectedWord?.learned_at)}
                />
                <PropertyView
                  label="ukončeno"
                  className="h-attribute"
                  value={shortenDate(selectedWord?.mastered_at)}
                />
              </div>
            </div>
          </OverviewCard>
          <HelpButton className="self-end" />
        </div>
      )}
    </>
  );
}
