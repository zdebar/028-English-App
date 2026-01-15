import OverviewCard from '@/components/UI/OverviewCard';
import PropertyView from '@/components/UI/PropertyView';
import { TEXTS } from '@/config/texts';
import HelpButton from '@/features/overlay/HelpButton';
import { shortenDate } from '@/features/vocabulary/vocabulary.utils';
import type { UserItemLocal } from '@/types/local.types';

interface VocabularyDetailCardProps {
  selectedWord: UserItemLocal | null;
  onClose: () => void;
  onReset: () => void;
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
  return (
    <div className="relative flex w-full flex-col items-center justify-start">
      <OverviewCard titleText={selectedWord?.czech} onClose={onClose} handleReset={onReset}>
        <div className="flex flex-col gap-4">
          <div>
            <PropertyView label="item_id" className="h-attribute" value={selectedWord?.item_id} />
            <PropertyView label={TEXTS.czech} className="h-attribute" value={selectedWord?.czech} />
            <PropertyView label={TEXTS.english} value={selectedWord?.english} />
            <PropertyView
              label={TEXTS.pronunciation}
              className="h-attribute"
              value={selectedWord?.pronunciation}
            />
            <PropertyView
              label={TEXTS.progress}
              className="h-attribute"
              value={selectedWord?.progress}
            />
          </div>
          <div>
            <PropertyView
              label={TEXTS.startedAt}
              className="h-attribute"
              value={shortenDate(selectedWord?.started_at)}
            />
            <PropertyView
              label={TEXTS.updatedAt}
              className="h-attribute"
              value={shortenDate(selectedWord?.updated_at)}
            />
            <PropertyView
              label={TEXTS.nextAt}
              className="h-attribute"
              value={shortenDate(selectedWord?.next_at)}
            />
            <PropertyView
              label={TEXTS.masteredAt}
              className="h-attribute"
              value={shortenDate(selectedWord?.started_at)}
            />
            <PropertyView
              label={TEXTS.finishedAt}
              className="h-attribute"
              value={shortenDate(selectedWord?.mastered_at)}
            />
          </div>
        </div>
      </OverviewCard>
      <HelpButton className="right-2 -bottom-12" />
    </div>
  );
}
