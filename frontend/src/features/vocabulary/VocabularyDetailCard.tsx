import OverviewCard from '@/components/UI/OverviewCard';
import PropertyView from '@/components/UI/PropertyView';
import config from '@/config/config';
import { TEXTS } from '@/locales/cs';
import HelpButton from '@/features/help/HelpButton';
import {
  formatVocabularyDateTime,
  hasVocabularyDate,
} from '@/features/vocabulary/vocabulary.utils';
import type { UserItemLocal } from '@/types/user-item.types';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import PlayButton from '@/features/audio/PlayButton';
import VolumeSlider from '../audio/VolumeSlider';
import InfoButton from '@/features/notes/InfoButton';
import NoteDetailCard from '@/features/notes/NoteDetailCard';
import { useNoteViewer } from '@/features/notes/use-note-viewer';
import { useToastStore } from '@/features/toast/use-toast-store';
import PronunciationToggleButton from '@/features/pronunciation/PronunciationToggleButton';
import { useAuthStore } from '@/features/auth/use-auth-store';

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
  const userId = useAuthStore((state) => state.userId);
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
        {
          label: lowercaseInitial(TEXTS.progress),
          value: formatProgress(
            selectedWord?.progress_cz_to_en,
            config.srs.intervals.czToEn.length,
          ),
        },
        {
          label: lowercaseInitial(TEXTS.practiceSchedule),
          value: formatPracticeSchedule(
            selectedWord?.next_at_cz_to_en,
            selectedWord?.mastered_at_cz_to_en,
          ),
        },
      ],
    },
    {
      direction: 'enToCz',
      title: lowercaseInitial(TEXTS.directionEnToCz),
      properties: [
        {
          label: lowercaseInitial(TEXTS.progress),
          value: formatProgress(
            selectedWord?.progress_en_to_cz,
            config.srs.intervals.enToCz.length,
          ),
        },
        {
          label: lowercaseInitial(TEXTS.practiceSchedule),
          value: formatPracticeSchedule(
            selectedWord?.next_at_en_to_cz,
            selectedWord?.mastered_at_en_to_cz,
          ),
        },
      ],
    },
  ] as const;

  const {
    playAudio,
    audioError,
    isAudioReady,
    loading: audioLoading,
  } = useAudioManager(selectedWord?.audio || null);
  const showToast = useToastStore((state) => state.showToast);
  const audioControlsDisabled =
    !selectedWord?.audio || audioLoading || audioError || !isAudioReady(selectedWord.audio);

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
      <div className="m-4 flex flex-col gap-4">
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
          disabled={audioControlsDisabled}
        />
        <VolumeSlider disabled={audioControlsDisabled} />
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
        <PronunciationToggleButton userId={userId} item={selectedWord} />
        <HelpButton />
      </div>
    </OverviewCard>
  );
}

function lowercaseInitial(value: string): string {
  return value.charAt(0).toLocaleLowerCase('cs-CZ') + value.slice(1);
}

function formatProgress(progress: number | null | undefined, total: number): string | undefined {
  if (progress == null) return undefined;
  return `${progress} / ${total}`;
}

function formatPracticeSchedule(
  nextDate: string | null | undefined,
  masteredDate: string | null | undefined,
): string {
  if (hasVocabularyDate(masteredDate)) return TEXTS.completedAt;

  const formattedNextDate = formatVocabularyDateTime(nextDate);
  if (formattedNextDate) return formattedNextDate;

  return lowercaseInitial(TEXTS.notScheduled);
}
