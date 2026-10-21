import OverviewCard from '@/components/UI/OverviewCard';
import PropertyView from '@/components/UI/PropertyView';
import { TEXTS } from '@/locales/cs';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
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
import { formatProgress } from '@/utils/progress.utils';
import ButtonWithModal from '@/features/modal/ButtonWithModal';
import type { ReviewDirection } from '@/types/practice.types';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import PronunciationIcon from '@/components/UI/icons/PronunciationIcon';
import Groups from '@/database/models/groups';
import PronunciationSoundDetailCard from '@/features/practice/PronunciationSoundDetailCard';
import { getUniquePronunciationSounds, splitPronunciationIntoSounds } from '@/utils/pronunciation.utils';
import type { GroupType } from '@/types/table.types';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

const NOT_AVAILABLE = TEXTS.notAvailable;

type VocabularyDetailCardProps = Readonly<{
  selectedWord: UserItemLocal | null;
  onClose: () => void;
  onReset: (direction: ReviewDirection) => Promise<void>;
}>;

type VocabularyProperty = Readonly<{
  label: string;
  value: string | undefined;
  classNameValue?: string;
}>;

type VocabularyDirectionSection = Readonly<{
  title: string;
  direction: ReviewDirection;
  properties: readonly VocabularyProperty[];
}>;

function getBaseProperties(selectedWord: UserItemLocal | null): readonly VocabularyProperty[] {
  return [
    { label: lowercaseInitial(TEXTS.czech), value: selectedWord?.czech },
    {
      label: lowercaseInitial(TEXTS.czechDescription),
      value: selectedWord
        ? (selectedWord.czech_description ?? TEXTS.noCzechDescription)
        : undefined,
      classNameValue: 'text-sm font-light',
    },
    { label: lowercaseInitial(TEXTS.english), value: selectedWord?.english },
    { label: lowercaseInitial(TEXTS.pronunciation), value: selectedWord?.pronunciation },
  ];
}

function getDirectionSections(
  selectedWord: UserItemLocal | null,
): readonly VocabularyDirectionSection[] {
  return ([
    {
      title: lowercaseInitial(TEXTS.directionCzToEn),
      direction: 'cz_to_en',
      properties: [
        {
          label: lowercaseInitial(TEXTS.progress),
          value: formatProgress(selectedWord?.progress_cz_to_en),
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
      title: lowercaseInitial(TEXTS.directionEnToCz),
      direction: 'en_to_cz',
      properties: [
        { label: lowercaseInitial(TEXTS.progress), value: formatProgress(selectedWord?.progress_en_to_cz) },
        {
          label: lowercaseInitial(TEXTS.practiceSchedule),
          value: formatPracticeSchedule(selectedWord?.next_at_en_to_cz, selectedWord?.mastered_at_en_to_cz),
        },
      ],
    },
  ] as const).filter((section) => section.direction === 'cz_to_en'
    ? selectedWord?.is_cz_to_en_enabled !== false
    : selectedWord?.is_en_to_cz_enabled !== false);
}

function isVocabularyAudioDisabled(
  selectedWord: UserItemLocal | null,
  audioLoading: boolean,
  audioError: boolean,
  isAudioReady: (audio: string) => boolean,
): boolean {
  if (!selectedWord?.audio?.trim()) return true;
  return audioLoading || audioError || !isAudioReady(selectedWord.audio);
}

async function playVocabularyAudio(
  selectedWord: UserItemLocal | null,
  playAudio: (audio: string) => Promise<boolean>,
  showToast: (message: string, type: 'error') => void,
): Promise<void> {
  if (!selectedWord?.audio?.trim()) return;
  const didPlay = await playAudio(selectedWord.audio);
  if (!didPlay) showToast(TEXTS.noAudio, 'error');
}

function VocabularyPropertyList({
  properties,
  labelClassName,
}: Readonly<{
  properties: readonly VocabularyProperty[];
  labelClassName: string;
}>) {
  return (
    <>
      {properties.map((property) => (
        <PropertyView
          key={property.label}
          label={property.label}
          className="grid grid-cols-2"
          classNameLabel={labelClassName}
          classNameValue={`min-w-0 break-words [overflow-wrap:anywhere] ${property.classNameValue ?? ''}`}
          alignTop
        >
          {property.value ?? NOT_AVAILABLE}
        </PropertyView>
      ))}
    </>
  );
}

function VocabularyDetails({
  baseProperties,
  directionSections,
  onReset,
}: Readonly<{
  baseProperties: readonly VocabularyProperty[];
  directionSections: readonly VocabularyDirectionSection[];
  onReset: (direction: ReviewDirection) => Promise<void>;
}>) {
  return (
    <div className="flex flex-col gap-3 pt-3">
      <div className="mx-4">
        <VocabularyPropertyList properties={baseProperties} labelClassName="w-auto" />
      </div>
      {directionSections.map((section) => (
        <section key={section.title} className="relative flex flex-col gap-2">
          <HelpText className="-top-5 left-0 whitespace-nowrap">
            {TEXTS.restartProgress}
          </HelpText>
          <ButtonWithModal
            className="h-input w-full justify-center font-bold"
            modalTitle={TEXTS.restartItemProgress}
            modalText={TEXTS.restartDirectionProgressDescription}
            title={TEXTS.restartProgress}
            onConfirm={() => onReset(section.direction)}
          >
            {section.title}
          </ButtonWithModal>
          <div className="mx-4">
            <VocabularyPropertyList properties={section.properties} labelClassName="w-auto" />
          </div>
        </section>
      ))}
    </div>
  );
}

function VocabularyAudioControls({
  selectedWord,
  audioControlsDisabled,
  pronunciationSounds,
  onOpenPronunciation,
  playAudio,
  showToast,
}: Readonly<{
  selectedWord: UserItemLocal | null;
  audioControlsDisabled: boolean;
  pronunciationSounds: readonly GroupType[];
  onOpenPronunciation: () => void;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
}>) {
  return (
    <div className="pos-bottom-left-control">
      <PlayButton
        onClick={() => playVocabularyAudio(selectedWord, playAudio, showToast)}
        disabled={audioControlsDisabled}
      />
      <SecondaryControlButton
        title={TEXTS.pronunciationGuide}
        ariaLabel={TEXTS.pronunciationGuide}
        onClick={onOpenPronunciation}
        disabled={pronunciationSounds.length === 0}
      >
        <PronunciationIcon />
      </SecondaryControlButton>
      <VolumeSlider disabled={audioControlsDisabled} />
    </div>
  );
}

function VocabularyNoteButton({
  noteId,
  openNote,
}: Readonly<{ noteId: number | null | undefined; openNote: (noteId: number) => void }>) {
  if (noteId == null) return null;
  return (
    <InfoButton
      title={TEXTS.tooltipNotes}
      onClick={(event) => {
        event.stopPropagation();
        openNote(noteId);
      }}
    />
  );
}

function VocabularyPronunciationDetail({
  sounds,
  pronunciationSounds,
  audio,
  index,
  onIndexChange,
  onClose,
}: Readonly<{
  sounds: readonly GroupType[];
  pronunciationSounds: readonly GroupType[];
  audio: string | null | undefined;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}>) {
  return (
    <PronunciationSoundDetailCard
      sounds={sounds}
      pronunciationSounds={pronunciationSounds}
      audio={audio}
      index={index}
      onIndexChange={onIndexChange}
      onClose={onClose}
    />
  );
}

function VocabularyDetailContent({
  pronunciationSounds,
  isNoteVisible,
  noteData,
  onCloseNote,
  baseProperties,
  directionSections,
  onReset,
  selectedWord,
  audioControlsDisabled,
  onOpenPronunciation,
  playAudio,
  showToast,
  noteId,
  openNote,
}: Readonly<{
  pronunciationSounds: readonly GroupType[];
  isNoteVisible: boolean;
  noteData: ReturnType<typeof useNoteViewer>['noteData'];
  onCloseNote: () => void;
  baseProperties: readonly VocabularyProperty[];
  directionSections: readonly VocabularyDirectionSection[];
  onReset: (direction: ReviewDirection) => Promise<void>;
  selectedWord: UserItemLocal | null;
  audioControlsDisabled: boolean;
  onOpenPronunciation: () => void;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
  noteId: number | null | undefined;
  openNote: (noteId: number) => void;
}>) {
  if (isNoteVisible) return <NoteDetailCard note={noteData} onClose={onCloseNote} />;

  return (
    <>
      <VocabularyDetails baseProperties={baseProperties} directionSections={directionSections} onReset={onReset} />
      <VocabularyAudioControls
        selectedWord={selectedWord}
        audioControlsDisabled={audioControlsDisabled}
        pronunciationSounds={pronunciationSounds}
        onOpenPronunciation={onOpenPronunciation}
        playAudio={playAudio}
        showToast={showToast}
      />
      <div className="pos-bottom-right-control">
        <VocabularyNoteButton noteId={noteId} openNote={openNote} />
        <HelpButton />
      </div>
    </>
  );
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
  const cardValues = getVocabularyCardValues(selectedWord);
  const baseProperties = getBaseProperties(selectedWord);
  const directionSections = getDirectionSections(selectedWord);
  const sounds = useLiveQuery(() => Groups.getSounds(), [], []) ?? [];
  const [pronunciationIndex, setPronunciationIndex] = useState<number | null>(null);
  const fullPronunciationSounds = splitPronunciationIntoSounds(cardValues.pronunciation, sounds);
  const pronunciationSounds = getUniquePronunciationSounds(fullPronunciationSounds);

  const {
    playAudio,
    audioError,
    isAudioReady,
    loading: audioLoading,
  } = useAudioManager(cardValues.audio);
  const showToast = useToastStore((state) => state.showToast);
  const audioControlsDisabled = isVocabularyAudioDisabled(
    selectedWord,
    audioLoading,
    audioError,
    isAudioReady,
  );

  const { isNoteVisible, noteData, openNote, closeNote } = useNoteViewer();

  const noteId = cardValues.noteId;

  if (pronunciationIndex !== null) {
    return (
      <VocabularyPronunciationDetail
        sounds={pronunciationSounds}
        pronunciationSounds={fullPronunciationSounds}
        audio={cardValues.audio}
        index={pronunciationIndex}
        onIndexChange={setPronunciationIndex}
        onClose={() => setPronunciationIndex(null)}
      />
    );
  }

  return (
    <OverviewCard
      buttonTitle={cardValues.title}
      onClose={onClose}
      className="bottom-controls-clearance relative"
      showResetAction={false}
    >
      <VocabularyDetailContent
        pronunciationSounds={pronunciationSounds}
        isNoteVisible={isNoteVisible}
        noteData={noteData}
        onCloseNote={closeNote}
        baseProperties={baseProperties}
        directionSections={directionSections}
        onReset={onReset}
        selectedWord={selectedWord}
        audioControlsDisabled={audioControlsDisabled}
        onOpenPronunciation={() => setPronunciationIndex(0)}
        playAudio={playAudio}
        showToast={showToast}
        noteId={noteId}
        openNote={openNote}
      />
    </OverviewCard>
  );
}

function lowercaseInitial(value: string): string {
  return value.charAt(0).toLocaleLowerCase('cs-CZ') + value.slice(1);
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

function getVocabularyCardValues(selectedWord: UserItemLocal | null | undefined) {
  return {
    pronunciation: selectedWord?.pronunciation ?? '',
    audio: selectedWord?.audio ?? null,
    noteId: selectedWord?.note_id,
    title: selectedWord?.english ?? '',
  };
}
