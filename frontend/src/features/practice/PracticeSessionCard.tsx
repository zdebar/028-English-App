import Notification from '@/components/UI/Notification';
import { usePracticeFooterConstraint } from '@/components/Layout/practice-footer-constraint';
import { STAR_SIZE } from '@/components/UI/StarProgress';
import DelayedNotification from '@/components/UI/DelayedNotification';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import BookIcon from '@/components/UI/icons/BookIcon';
import PlayButton from '@/features/audio/PlayButton';
import VolumeSlider from '@/features/audio/VolumeSlider';
import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';
import { useGrammarViewer } from '@/features/grammar/use-grammar-viewer';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import InfoButton from '@/features/notes/InfoButton';
import NoteDetailCard from '@/features/notes/NoteDetailCard';
import { useNoteViewer } from '@/features/notes/use-note-viewer';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { TEXTS } from '@/locales/cs';
import HintButton from './buttons/HintButton';
import KnownButton from './buttons/KnownButton';
import MasterItemButton from './buttons/MasterItemButton';
import RepeatButton from './buttons/RepeatButton';
import PracticeStarsRow from './components/PracticeStarsRow';
import { usePracticeStars } from './hooks/use-practice-stars';
import PronunciationToggleButton from '@/features/pronunciation/PronunciationToggleButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import type { UserItemLocal } from '@/types/user-item.types';
import RightArrowIcon from '@/components/UI/icons/RightArrowIcon';
import ControlButton from './buttons/ControlButton';
import { usePointerReleaseLock } from './hooks/use-pointer-release-lock';

export type PracticeSessionCardProps = Readonly<{
  noteId: number | null;
  grammarChunkId: number | null;
  progressLabel: string | number;
  isCzToEn: boolean;
  revealed: boolean;
  czech: string | undefined;
  english: string | undefined;
  pronunciation: string | undefined;
  audioDisabled: boolean;
  showDirectionChange: boolean;
  handleReveal: () => void;
  plusHint: () => void;
  nextRepeat: () => void | Promise<void>;
  repeatDisabled?: boolean;
  nextKnown: () => void | Promise<void>;
  completeCurrent?: () => void | Promise<void>;
  completeDisabled?: boolean;
  audioError: boolean;
  playAudio: () => void;
  audioLoading: boolean;
  isBlockTrainingPractice?: boolean;
  isPronunciationPractice?: boolean;
  pronunciationItem?: UserItemLocal | null;
  nextPronunciation?: () => void;
  onPronunciationSelectionChange?: (selected: boolean) => void;
}>;

type PracticeControlsProps = Pick<
  PracticeSessionCardProps,
  | 'completeCurrent'
  | 'completeDisabled'
  | 'isPronunciationPractice'
  | 'nextKnown'
  | 'nextPronunciation'
  | 'nextRepeat'
  | 'plusHint'
  | 'repeatDisabled'
  | 'revealed'
  | 'showDirectionChange'
>;

function AudioStatusMessage({
  audioError,
  audioLoading,
}: Pick<PracticeSessionCardProps, 'audioError' | 'audioLoading'>) {
  if (audioLoading) {
    return <DelayedNotification message={TEXTS.loadingAudio} />;
  }
  if (audioError) {
    return <p className="font-headings color-info">{TEXTS.noAudio}</p>;
  }
  return null;
}

function PracticeControls({
  completeCurrent,
  completeDisabled = false,
  isPronunciationPractice = false,
  nextKnown,
  nextPronunciation,
  nextRepeat,
  plusHint,
  repeatDisabled = false,
  revealed,
  showDirectionChange,
}: PracticeControlsProps) {
  const { isLocked: isSkipGestureLocked, lockUntilRelease: lockHintUntilRelease } =
    usePointerReleaseLock();

  if (!revealed) {
    return (
      <HintButton
        onClick={plusHint}
        disabled={showDirectionChange || isSkipGestureLocked}
      />
    );
  }

  if (isPronunciationPractice) {
    return (
      <ControlButton
        icon={<RightArrowIcon />}
        label={TEXTS.next}
        onClick={nextPronunciation}
        disabled={!nextPronunciation}
      />
    );
  }

  return (
    <>
      <MasterItemButton
        onConfirm={() => {
          lockHintUntilRelease();
          return completeCurrent?.();
        }}
        disabled={completeDisabled || !completeCurrent || showDirectionChange}
      />
      <RepeatButton
        onClick={() => {
          void nextRepeat();
        }}
        disabled={repeatDisabled || showDirectionChange}
      />
      <KnownButton
        onClick={() => {
          void nextKnown();
        }}
        disabled={showDirectionChange}
      />
    </>
  );
}

export default function PracticeSessionCard({
  noteId,
  grammarChunkId,
  progressLabel,
  isCzToEn,
  revealed,
  czech,
  english,
  pronunciation,
  audioDisabled,
  showDirectionChange,
  handleReveal,
  plusHint,
  nextRepeat,
  repeatDisabled = false,
  nextKnown,
  completeCurrent,
  completeDisabled = false,
  audioError,
  playAudio,
  audioLoading,
  isBlockTrainingPractice = false,
  isPronunciationPractice = false,
  pronunciationItem = null,
  nextPronunciation,
  onPronunciationSelectionChange,
}: PracticeSessionCardProps) {
  usePracticeFooterConstraint();
  const userId = useAuthStore((state) => state.userId);
  const dailyCount = useUserStore((state) => state.dailyCount);
  const { isGrammarVisible, grammarData, openGrammar, closeGrammar } = useGrammarViewer();
  const { isNoteVisible, noteData, openNote, closeNote } = useNoteViewer();

  const { starChunk, starsPerRow, starCount, displayedChunkCount } = usePracticeStars(dailyCount);

  const cardText = revealed ? undefined : TEXTS.reveal;
  const cardStyle = revealed ? 'color-audio-disabled' : 'color-button';
  const directionText = isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz;
  const showAudioControls = !audioDisabled;
  const showGrammarButton = grammarChunkId != null && grammarChunkId > 0 && revealed;
  const showNoteButton = Boolean(noteId && revealed);
  const audioControlsDisabled =
    !showAudioControls || showDirectionChange || audioLoading || (isCzToEn && !revealed);
  const grammarButtonDisabled = !showGrammarButton || showDirectionChange;
  const noteButtonDisabled = !showNoteButton || showDirectionChange;
  const practiceControlColumns =
    revealed && !isPronunciationPractice ? 'grid-cols-3' : 'grid-cols-1';

  if (isGrammarVisible) {
    return (
      <GrammarDetailCard grammar={grammarData} onClose={closeGrammar} showHelpButton={false} />
    );
  }
  if (isNoteVisible) return <NoteDetailCard note={noteData} onClose={closeNote} />;

  return (
    <div className="bottom-controls-clearance relative flex min-h-0 w-full grow flex-col items-center">
      <div className="card-width card-height relative gap-1">
        <button
          type="button"
          className={`relative grid h-full w-full grow cursor-pointer grid-rows-[3.5rem_minmax(0,1fr)_3.5rem] items-center p-4 text-inherit select-none ${cardStyle} `}
          onClick={handleReveal}
          title={cardText}
          aria-disabled={revealed}
        >
          {!revealed && !showDirectionChange && (
            <HelpText className="top-17 left-1/2 -translate-x-1/2">{TEXTS.reveal}</HelpText>
          )}
          <div id="top-bar" className="relative grid h-14 w-full grid-rows-2 text-center">
            <div className="flex min-h-0 items-center justify-center">
              {isBlockTrainingPractice ? (
                <p className="color-info font-headings">{TEXTS.blockTrainingFinishAll}</p>
              ) : null}
            </div>
            <div className="flex min-h-0 items-center justify-center">
              <AudioStatusMessage audioError={audioError} audioLoading={audioLoading} />
            </div>
          </div>
          <div
            id="practice-main-content"
            className="flex min-h-0 w-full items-center justify-center"
          >
            {showDirectionChange ? (
              <Notification>{directionText}</Notification>
            ) : (
              <div id="item" className="flex flex-col justify-center gap-1">
                <p lang="cs" className="text-center font-bold">
                  {czech}
                </p>
                <p lang="en" translate="no" className="text-center font-normal">
                  {english}
                </p>
                <p translate="no" className="text-center font-normal">
                  {pronunciation}
                </p>
              </div>
            )}
          </div>

          <div
            className="relative flex h-8 w-full items-center justify-between self-end"
            id="bottom-bar"
          >
            <p className="px-2 font-light" title={TEXTS.progress}>
              {progressLabel}
            </p>
            <HelpText className="bottom-7.5">
              {isBlockTrainingPractice ? TEXTS.blockTrainingProgressHelp : TEXTS.progress}
            </HelpText>
            {!isPronunciationPractice && (
              <>
                <div
                  className="relative flex items-center gap-2 px-2 font-light"
                  title={TEXTS.nextStarProgress}
                >
                  <PracticeStarsRow
                    starCount={starCount}
                    displayedChunkCount={displayedChunkCount}
                    starChunk={starChunk}
                    starsPerRow={starsPerRow}
                    size={STAR_SIZE}
                  />
                </div>
                <HelpText className="right-0 bottom-7.5 flex flex-col items-end">
                  {TEXTS.nextStarProgress}
                </HelpText>
              </>
            )}
          </div>
        </button>
        <div
          id="practice-controls"
          className={`relative grid w-full gap-1 ${practiceControlColumns}`}
        >
          <PracticeControls
            completeCurrent={completeCurrent}
            completeDisabled={completeDisabled}
            isPronunciationPractice={isPronunciationPractice}
            nextKnown={nextKnown}
            nextPronunciation={nextPronunciation}
            nextRepeat={nextRepeat}
            plusHint={plusHint}
            repeatDisabled={repeatDisabled}
            revealed={revealed}
            showDirectionChange={showDirectionChange}
          />
        </div>

        <div className="pos-bottom-left-control">
          <PlayButton onClick={playAudio} disabled={audioControlsDisabled} />
          <VolumeSlider disabled={audioControlsDisabled} />
          <PronunciationToggleButton
            userId={userId}
            item={pronunciationItem}
            showHelpText
            onSelectionChange={onPronunciationSelectionChange}
          />
        </div>
        <div className="pos-bottom-right-control">
          <SecondaryControlButton
            title={TEXTS.grammar}
            ariaLabel={TEXTS.grammar}
            onClick={() => {
              if (grammarChunkId == null || grammarButtonDisabled) return;
              openGrammar(grammarChunkId);
            }}
            disabled={grammarButtonDisabled}
          >
            <BookIcon />
            <HelpText className="-right-6 bottom-10 flex flex-col items-end landscape:invisible">
              {TEXTS.grammar}
            </HelpText>
          </SecondaryControlButton>
          <InfoButton
            title={TEXTS.tooltipNotes}
            disabled={noteButtonDisabled}
            onClick={(e) => {
              e.stopPropagation();
              if (noteId == null || noteButtonDisabled) return;
              openNote(noteId);
            }}
          >
            <HelpText className="-bottom-4 left-0 flex flex-col items-end landscape:invisible">
              {TEXTS.tooltipNotes}
            </HelpText>
          </InfoButton>
          <HelpButton />
        </div>
      </div>
    </div>
  );
}
