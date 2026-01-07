import OverviewCard from '@/components/UI/OverviewCard';
import PropertyView from '@/components/UI/PropertyView';
import { shortenDate } from '@/features/vocabulary/vocabulary.utils';
import HelpButton from '@/features/overlay/HelpButton';
import type { UserItemLocal } from '@/types/local.types';

interface VocabularyDetailCardProps {
  selectedWord: UserItemLocal | null;
  onClose: () => void;
  onReset: () => void;
}

export default function VocabularyDetailCard({
  selectedWord,
  onClose,
  onReset,
}: VocabularyDetailCardProps) {
  return (
    <div className="relative flex w-full grow flex-col items-center justify-start">
      <OverviewCard titleText={selectedWord?.czech} onClose={onClose} handleReset={onReset}>
        <div className="flex flex-col gap-4">
          <div>
            <PropertyView label="item_id" className="h-attribute" value={selectedWord?.item_id} />
            <PropertyView label="česky" className="h-attribute" value={selectedWord?.czech} />
            <PropertyView label="anglicky" value={selectedWord?.english} />
            <PropertyView
              label="výslovnost"
              className="h-attribute"
              value={selectedWord?.pronunciation}
            />
            <PropertyView label="pokrok" className="h-attribute" value={selectedWord?.progress} />
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
              value={shortenDate(selectedWord?.started_at)}
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
  );
}
