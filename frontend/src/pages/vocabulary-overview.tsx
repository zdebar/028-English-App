import { useState, useEffect, useCallback } from "react";
import ButtonRectangular from "@/components/UI/button-rectangular";
import UserItem from "@/database/models/user-items";
import type { UserItemLocal } from "@/types/local.types";
import { CloseIcon } from "@/components/UI/icons";
import { useNavigate } from "react-router-dom";
import OverviewCard from "@/components/UI/overview-card";
import DirectionDropdown from "@/components/UI/direction-dropdown";
import SettingProperty from "@/components/UI/setting-property";
import { shortenDate } from "@/utils/database.utils";
import { useFetch } from "@/hooks/user-fetch";
import { useAuth } from "@/hooks/use-auth";

export default function VocabularyOverview() {
  const { userId } = useAuth();

  const fetchVocabulary = useCallback(async () => {
    if (userId) {
      return await UserItem.getUserStartedVocabulary(userId);
    }
    return [];
  }, [userId]);

  const {
    data: words,
    error,
    isLoading,
  } = useFetch<UserItemLocal[]>(fetchVocabulary);

  const [filteredWords, setFilteredWords] = useState<UserItemLocal[] | null>(
    null
  );
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

  const handleClearUserItem = async () => {
    const itemId = selectedWord?.item_id;
    if (typeof itemId === "number" && userId) {
      await UserItem.resetUserItemById(userId, itemId);
    }
  };

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
              <ButtonRectangular
                className="w-button grow-0"
                onClick={() => navigate("/profile")}
              >
                <CloseIcon />
              </ButtonRectangular>
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
            {isLoading ? (
              <p className="text-left h-input flex justify-start pl-4">
                Načítání...
              </p>
            ) : filteredWords && filteredWords.length > 0 ? (
              <>
                {filteredWords.slice(0, 10).map((item, index) => (
                  <ButtonRectangular
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
                  </ButtonRectangular>
                ))}
                {filteredWords.length > 10 && (
                  <p className="text-left h-input flex justify-start pl-4 text-blue-500">
                    ...a další
                  </p>
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
        <OverviewCard
          titleText={selectedWord?.czech}
          onClose={() => setCardVisible(false)}
          handleReset={handleClearUserItem}
        >
          <div className="flex flex-col gap-4">
            <div>
              <SettingProperty
                label="item_id"
                className="h-attribute"
                value={selectedWord?.item_id}
              />
              <SettingProperty
                label="česky"
                className="h-attribute"
                value={selectedWord?.czech}
              />
              <SettingProperty label="anglicky" value={selectedWord?.english} />
              <SettingProperty
                label="výslovnost"
                className="h-attribute"
                value={selectedWord?.pronunciation}
              />
              <SettingProperty
                label="pokrok"
                className="h-attribute"
                value={selectedWord?.progress}
              />
            </div>
            <div>
              <SettingProperty
                label="start"
                className="h-attribute"
                value={shortenDate(selectedWord?.started_at)}
              />
              <SettingProperty
                label="změněno"
                className="h-attribute"
                value={shortenDate(selectedWord?.updated_at)}
              />
              <SettingProperty
                label="další"
                className="h-attribute"
                value={shortenDate(selectedWord?.next_at)}
              />
              <SettingProperty
                label="naučeno"
                className="h-attribute"
                value={shortenDate(selectedWord?.learned_at)}
              />
              <SettingProperty
                label="ukončeno"
                className="h-attribute"
                value={shortenDate(selectedWord?.mastered_at)}
              />
            </div>
          </div>
        </OverviewCard>
      )}
    </>
  );
}
