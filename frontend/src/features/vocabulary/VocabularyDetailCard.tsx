import OverviewCard from '@/components/UI/OverviewCard';
import PropertyView from '@/components/UI/PropertyView';
import { TEXTS } from '@/locales/cs';
import HelpButton from '@/features/help/HelpButton';
import { shortenDate } from '@/features/vocabulary/vocabulary.utils';
import type { UserItemLocal } from '@/types/user-item.types';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import VolumeSlider from '../audio/VolumeSlider';
import PlayIcon from '@/components/UI/icons/PlayIcon';
import HelpText from '../help/HelpText';

const NOT_AVAILABLE = TEXTS.notAvailable;
const NOT_MASTERED = TEXTS.notMastered;

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
    { label: TEXTS.startedAt, value: shortenDate(selectedWord?.started_at) },
    { label: TEXTS.updatedAt, value: shortenDate(selectedWord?.updated_at) },
    { label: TEXTS.nextAt, value: shortenDate(selectedWord?.next_at) },
    { label: TEXTS.masteredAt, value: shortenDate(selectedWord?.mastered_at) || NOT_MASTERED },
  ];

  const { playAudio } = useAudioManager(selectedWord?.audio || null);

  return (
    <OverviewCard
      buttonTitle={selectedTitle}
      onClose={onClose}
      handleReset={onReset}
      modalTitle={TEXTS.restartItemProgress}
      className="relative"
    >
      <div className="flex flex-col gap-4 p-4">
        <div>
          {baseProperties.map((property) => (
            <PropertyView key={property.label} label={property.label}>
              {property.value ?? NOT_AVAILABLE}
            </PropertyView>
          ))}
        </div>
        <PropertyView key={TEXTS.progress} label={TEXTS.progress}>
          {selectedWord?.progress ?? NOT_AVAILABLE}
        </PropertyView>
        <div>
          {dateProperties.map((property) => (
            <PropertyView key={property.label} label={property.label}>
              {property.value ?? NOT_AVAILABLE}
            </PropertyView>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-12.5 left-2 flex">
        <button
          onClick={() => {
            if (!selectedWord?.audio) return;
            playAudio(selectedWord.audio);
          }}
          className="size-help-button relative flex cursor-pointer items-center justify-center"
          title={TEXTS.audio}
        >
          <PlayIcon />
          <HelpText className="-top-3.5 left-0">{TEXTS.audio}</HelpText>
        </button>
        <VolumeSlider className="h-13.5" />
      </div>
      <HelpButton className="right-0 -bottom-13.5" />
    </OverviewCard>
  );
}
