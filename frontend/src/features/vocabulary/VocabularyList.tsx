import Button from "@/components/UI/buttons/Button";
import CloseIcon from "@/components/UI/icons/CloseIcon";
import DirectionDropdown from "@/features/vocabulary/DirectionDropdown";
import { getMoreText } from "@/features/vocabulary/vocabulary.utils";
import { type UserItemLocal } from "@/types/local.types";

interface VocabularyListProps {
  filteredWords: UserItemLocal[];
  visibleCount: number;
  displayField: "czech" | "english";
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  setDisplayField: (val: "czech" | "english") => void;
  setVisibleCount: (val: number) => void;
  onSelect: (index: number) => void;
  error: string | null;
  onClose: () => void;
}

export default function VocabularyList({
  filteredWords,
  visibleCount,
  displayField,
  searchTerm,
  setSearchTerm,
  setDisplayField,
  setVisibleCount,
  onSelect,
  error,
  onClose,
}: VocabularyListProps) {
  const visibleItems = filteredWords.slice(0, visibleCount);
  const remainingCount = filteredWords.length - visibleCount;

  return (
    <div className="card-width relative h-full flex flex-col gap-1 justify-start">
      <div className="flex flex-col gap-1 bg-background-light dark:bg-background-dark">
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
              className="grow flex items-center border border-dashed h-button"
            />
          )}
          <Button className="w-button grow-0" onClick={onClose}>
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
      <div className="overflow-y-auto flex flex-col gap-1">
        {filteredWords && filteredWords.length > 0 ? (
          <>
            {visibleItems.map((item, index) => (
              <Button
                key={item.item_id}
                className="text-left grow-0 h-input flex justify-start p-4"
                onClick={() => onSelect(index)}
              >
                {displayField === "czech"
                  ? ` ${item.czech} `
                  : ` ${item.english} `}
              </Button>
            ))}
            {remainingCount > 0 && (
              <button
                onClick={() => setVisibleCount(visibleCount + 8)}
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
  );
}
