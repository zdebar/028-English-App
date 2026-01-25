import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import CloseButton from '@/components/UI/buttons/CloseButton';
import config from '@/config/config';
import { TEXTS } from '@/config/texts';
import DirectionDropdown from '@/features/vocabulary/DirectionDropdown';
import { getMoreTextInCzech } from '@/features/vocabulary/vocabulary.utils';
import { type UserItemLocal } from '@/types/local.types';

interface VocabularyListProps {
  filteredWords: UserItemLocal[];
  visibleCount: number;
  displayField: 'czech' | 'english';
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  setDisplayField: (val: 'czech' | 'english') => void;
  setVisibleCount: (val: number) => void;
  onSelect: (index: number) => void;
  error: string | null;
  onClose: () => void;
}

/**
 * VocabularyList component
 *
 * @param filteredWords - Array of vocabulary items to display.
 * @param visibleCount - Number of items currently visible.
 * @param displayField - Field to display ('czech' or 'english').
 * @param searchTerm - Current search input value.
 * @param setSearchTerm - Function to update the search term.
 * @param setDisplayField - Function to change the displayed field.
 * @param setVisibleCount - Function to update the number of visible items.
 * @param onSelect - Callback when a word is selected.
 * @param error - Error message to display.
 * @param onClose - Callback to close the list view.
 * @returns The vocabulary list UI.
 */
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
    <div className="card-width relative flex h-full flex-col justify-start gap-1">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-1">
          {error ? (
            <div className="h-button flex grow items-center justify-start border border-dashed">
              {error}
            </div>
          ) : (
            <DirectionDropdown
              value={displayField}
              options={[
                { value: 'czech', label: 'Čeština' },
                { value: 'english', label: 'Angličtina' },
              ]}
              onChange={(value) => setDisplayField(value as 'czech' | 'english')}
              className="h-button flex grow items-center border border-dashed"
            />
          )}
          <CloseButton className="w-button grow-0" onClick={onClose} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={TEXTS.enterPrompt}
          className="h-input color-base border border-dashed pl-4"
        />
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto">
        {filteredWords && filteredWords.length > 0 ? (
          <>
            {visibleItems.map((item, index) => (
              <ButtonRectangular
                key={item.item_id}
                className="h-input flex grow-0 justify-start p-4 text-left"
                onClick={() => onSelect(index)}
              >
                {displayField === 'czech' ? item.czech : item.english}
              </ButtonRectangular>
            ))}
            {remainingCount > 0 && (
              <button
                onClick={() => setVisibleCount(visibleCount + config.vocabulary.itemsPerPage)}
                className="mt-2 w-full text-center font-bold hover:underline"
              >
                ... {TEXTS.and + ' ' + remainingCount + ' ' + getMoreTextInCzech(remainingCount)}
              </button>
            )}
          </>
        ) : (
          <p className="h-input flex justify-start pl-4 text-left">{TEXTS.noStartedVocabulary}</p>
        )}
      </div>
    </div>
  );
}
