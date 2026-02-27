import OverviewCard from '@/components/UI/OverviewCard';
import PropertyView from '@/components/UI/PropertyView';
import { TEXTS } from '@/locales/cs';
import HelpButton from '@/features/help/HelpButton';
import { shortenDate } from '@/features/vocabulary/vocabulary.utils';
import type { UserItemLocal } from '@/types/local.types';

const NOT_AVAILABLE = TEXTS.notAvailable;

interface VocabularyDetailCardProps {
  selectedWord: UserItemLocal | null;
  onClose: () => void;
  onReset: () => Promise<void>;
}

/**
 * VocabularyDetailCard component
 *
 * @param selectedWord - The vocabulary item to display details for.
 * @param onClose - Callback to close the detail card.
 * @param onReset - Callback to reset the user's progress for the word.
 * @returns The vocabulary detail card UI.
 */
export default function VocabularyDetailCard({
  selectedWord,
  onClose,
  onReset,
}: VocabularyDetailCardProps) {
  const baseProperties = [
    { label: TEXTS.czech, value: selectedWord?.czech },
    { label: TEXTS.english, value: selectedWord?.english },
    { label: TEXTS.pronunciation, value: selectedWord?.pronunciation },
    { label: TEXTS.progress, value: selectedWord?.progress },
  ];

  const lessonProperties = [
    { label: TEXTS.levelName, value: selectedWord?.level_name ?? NOT_AVAILABLE },
    { label: TEXTS.lessonOrder, value: selectedWord?.lesson_order ?? NOT_AVAILABLE },
    { label: TEXTS.lessonName, value: selectedWord?.lesson_name ?? NOT_AVAILABLE },
  ];

  const dateProperties = [
    { label: TEXTS.startedAt, value: shortenDate(selectedWord?.started_at) },
    { label: TEXTS.updatedAt, value: shortenDate(selectedWord?.updated_at) },
    { label: TEXTS.nextAt, value: shortenDate(selectedWord?.next_at) },
    { label: TEXTS.masteredAt, value: shortenDate(selectedWord?.mastered_at) },
  ];

  return (
    <div className="card-width relative flex w-full flex-col items-center justify-start">
      <OverviewCard buttonTitle={selectedWord?.czech} onClose={onClose} handleReset={onReset}>
        <div className="flex flex-col gap-4">
          <div>
            {baseProperties.map((property) => (
              <PropertyView key={property.label} label={property.label} value={property.value} />
            ))}
          </div>
          <div>
            {lessonProperties.map((property) => (
              <PropertyView key={property.label} label={property.label} value={property.value} />
            ))}
          </div>
          <div>
            {dateProperties.map((property) => (
              <PropertyView key={property.label} label={property.label} value={property.value} />
            ))}
          </div>
        </div>
      </OverviewCard>
      <HelpButton className="right-1 -bottom-10.5" />
    </div>
  );
}
