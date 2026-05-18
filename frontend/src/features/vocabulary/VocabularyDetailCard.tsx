import OverviewCard from '@/components/UI/OverviewCard';
import PropertyView from '@/components/UI/PropertyView';
import { TEXTS } from '@/locales/cs';
import HelpButton from '@/features/help/HelpButton';
import { shortenDate } from '@/features/vocabulary/vocabulary.utils';
import type { UserItemLocal } from '@/types/user-item.types';

const NOT_AVAILABLE = TEXTS.notAvailable;

type VocabularyDetailCardProps = Readonly<{
  selectedWord: UserItemLocal | null;
  selectedTitle: string;
  onClose: () => void;
  onReset: () => Promise<void>;
}>;

/**
 * VocabularyDetailCard component
 *
 * @param selectedWord - The vocabulary item to display details for.
 * @param selectedTitle - The title to display on the card. Czech or english name of the word.
 * @param onClose - Callback to close the detail card.
 * @param onReset - Callback to reset the user's progress for the word.
 * @returns The vocabulary detail card UI.
 */
export default function VocabularyDetailCard({
  selectedWord,
  selectedTitle,
  onClose,
  onReset,
}: VocabularyDetailCardProps) {
  const baseProperties = [
    { label: TEXTS.czech, value: selectedWord?.czech },
    { label: TEXTS.english, value: selectedWord?.english },
    { label: TEXTS.pronunciation, value: selectedWord?.pronunciation },
  ];

  const dateProperties = [
    { label: TEXTS.progress, value: selectedWord?.progress },
    { label: TEXTS.startedAt, value: shortenDate(selectedWord?.started_at) },
    { label: TEXTS.updatedAt, value: shortenDate(selectedWord?.updated_at) },
    { label: TEXTS.nextAt, value: shortenDate(selectedWord?.next_at) },
    { label: TEXTS.masteredAt, value: shortenDate(selectedWord?.mastered_at) },
  ];

  return (
    <OverviewCard
      buttonTitle={selectedTitle}
      onClose={onClose}
      handleReset={onReset}
      modalTitle={TEXTS.restartItemProgress}
    >
      <div className="flex flex-col gap-4 p-4">
        <div>
          {baseProperties.map((property) => (
            <PropertyView key={property.label} label={property.label}>
              {property.value ?? NOT_AVAILABLE}
            </PropertyView>
          ))}
        </div>
        <div>
          {dateProperties.map((property) => (
            <PropertyView key={property.label} label={property.label}>
              {property.value ?? NOT_AVAILABLE}
            </PropertyView>
          ))}
        </div>
      </div>
      <HelpButton className="right-1 -bottom-10.5" />
    </OverviewCard>
  );
}
