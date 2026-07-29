import OverviewCard from '@/components/UI/OverviewCard';
import PropertyView from '@/components/UI/PropertyView';
import { TEXTS } from '@/locales/cs';
import HelpButton from '@/features/help/HelpButton';
import { shortenDate } from '@/features/vocabulary/vocabulary.utils';
import type { UserItemLocal } from '@/types/user-item.types';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import PlayButton from '@/features/audio/PlayButton';
import VolumeSlider from '../audio/VolumeSlider';
import InfoButton from '@/features/notes/InfoButton';
import NoteDetailCard from '@/features/notes/NoteDetailCard';
import { useNoteViewer } from '@/features/notes/use-note-viewer';
import { useToastStore } from '@/features/toast/use-toast-store';

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
    { label: lowercaseInitial(TEXTS.czech), value: selectedWord?.czech },
    { label: lowercaseInitial(TEXTS.english), value: selectedWord?.english },
    { label: lowercaseInitial(TEXTS.pronunciation), value: selectedWord?.pronunciation },
  ];

  const directionSections = [
    {
      direction: 'czToEn',
      title: lowercaseInitial(TEXTS.directionCzToEn),
      properties: [
        { label: lowercaseInitial(TEXTS.progress), value: selectedWord?.progress_cz_to_en },
        {
          label: lowercaseInitial(TEXTS.nextAt),
          value: shortenDate(selectedWord?.next_at_cz_to_en),
        },
        {
          label: lowercaseInitial(TEXTS.masteredAt),
          value: shortenDate(selectedWord?.mastered_at_cz_to_en),
        },
      ],
    },
    {
      direction: 'enToCz',
      title: lowercaseInitial(TEXTS.directionEnToCz),
      properties: [
        { label: lowercaseInitial(TEXTS.progress), value: selectedWord?.progress_en_to_cz },
        {
          label: lowercaseInitial(TEXTS.nextAt),
          value: shortenDate(selectedWord?.next_at_en_to_cz),
        },
        {
          label: lowercaseInitial(TEXTS.masteredAt),
          value: shortenDate(selectedWord?.mastered_at_en_to_cz),
        },
      ],
    },
  ] as const;

  const dateProperties = [
    {
      label: lowercaseInitial(TEXTS.startedAt),
      value: shortenDate(selectedWord?.started_at),
    },
    {
      label: lowercaseInitial(TEXTS.updatedAt),
      value: shortenDate(selectedWord?.updated_at),
    },
  ];

  const {
    playAudio,
    audioError,
    isAudioReady,
    loading: audioLoading,
  } = useAudioManager(selectedWord?.audio || null);
  const showToast = useToastStore((state) => state.showToast);

  const { isNoteVisible, noteData, openNote, closeNote } = useNoteViewer();

  const noteId = selectedWord?.note_id;

  if (isNoteVisible) return <NoteDetailCard note={noteData} onClose={closeNote} />;

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
            <PropertyView
              key={property.label}
              label={property.label}
              className="grid grid-cols-2"
              classNameLabel="w-auto"
              classNameValue="min-w-0"
            >
              {property.value ?? NOT_AVAILABLE}
            </PropertyView>
          ))}
        </div>
        <div>
          {dateProperties.map((property) => (
            <PropertyView
              key={property.label}
              label={property.label}
              className="grid grid-cols-2"
              classNameLabel="w-30 w-auto"
              classNameValue="min-w-0"
            >
              {property.value ?? NOT_AVAILABLE}
            </PropertyView>
          ))}
        </div>
        {directionSections.map((section) => (
          <section key={section.direction}>
            <h3 className="font-bold">{section.title}</h3>
            {section.properties.map((property) => (
              <PropertyView
                key={property.label}
                label={property.label}
                className="grid grid-cols-2"
                classNameLabel="w-30 w-auto"
                classNameValue="min-w-0"
              >
                {property.value ?? NOT_AVAILABLE}
              </PropertyView>
            ))}
          </section>
        ))}
      </div>
      <div className="pos-bottom-left-control">
        <PlayButton
          onClick={async () => {
            if (!selectedWord?.audio) return;
            const didPlay = await playAudio(selectedWord.audio);
            if (!didPlay) {
              showToast(TEXTS.noAudio, 'error');
            }
          }}
          disabled={
            !selectedWord?.audio || audioLoading || audioError || !isAudioReady(selectedWord.audio)
          }
        />
        <VolumeSlider />
      </div>
      <div className="pos-bottom-right-control">
        {noteId && (
          <InfoButton
            title={TEXTS.tooltipNotes}
            onClick={(e) => {
              e.stopPropagation();
              openNote(noteId);
            }}
          />
        )}
        <HelpButton />
      </div>
    </OverviewCard>
  );
}

function lowercaseInitial(value: string): string {
  return value.charAt(0).toLocaleLowerCase('cs-CZ') + value.slice(1);
}
