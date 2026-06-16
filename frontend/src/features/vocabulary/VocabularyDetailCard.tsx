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
import { TableName } from '@/types/table.types';
import { useEntityByTable } from '../practice/hooks/use-entity-by-table';
import SimpleOverviewCard from '../practice/SimpleOverviewCard';
import NoteButton from '@/components/UI/buttons/NoteButton';

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

  const {
    isVisible: isNoteVisible,
    entityData: noteData,
    openEntityById: handleNote,
    closeEntity: closeNote,
  } = useEntityByTable(TableName.Notes);

  const noteId = selectedWord?.note_id;

  if (isNoteVisible) return <SimpleOverviewCard data={noteData} onClose={closeNote} />;

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
      <div className="pos-bottom-left-control flex">
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
        <VolumeSlider className="h-button" />
      </div>
      <div className="pos-bottom-right-control flex items-center gap-2">
        {noteId && (
          <NoteButton
            title={TEXTS.tooltipNotes}
            onClick={(e) => {
              e.stopPropagation();
              handleNote(noteId);
            }}
          />
        )}
        <HelpButton />
      </div>
    </OverviewCard>
  );
}
