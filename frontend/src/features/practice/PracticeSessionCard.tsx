import Notification from '@/components/UI/Notification';
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

export type PracticeSessionCardProps = Readonly<{
  noteId: number | null;
  grammarId: number | null;
  progressLabel: string | number;
  isCzToEn: boolean;
  revealed: boolean;
  showNewGrammarIndicator: boolean;
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
}>;

export default function PracticeSessionCard({
  noteId,
  grammarId,
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
}: PracticeSessionCardProps) {
  const dailyCount = useUserStore((state) => state.dailyCount);
  const { isGrammarVisible, grammarData, openGrammar, closeGrammar } = useGrammarViewer();
  const { isNoteVisible, noteData, openNote, closeNote } = useNoteViewer();

  const { starChunk, starsPerRow, starCount, displayedChunkCount } = usePracticeStars(dailyCount);

  const cardText = revealed ? undefined : TEXTS.reveal;
  const cardStyle = revealed ? 'color-audio-disabled' : 'color-button';
  const directionText = isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz;
  const showAudioControls = !audioDisabled;
  const showGrammarButton = Boolean(grammarId && revealed);
  const showNoteButton = Boolean(noteId && revealed);
  let audioStatusMessage = null;

  if (audioLoading) {
    audioStatusMessage = <DelayedNotification message={TEXTS.loadingAudio} />;
  } else if (audioError) {
    audioStatusMessage = <p className="px-2">{TEXTS.noAudio}</p>;
  }

  if (isGrammarVisible) return <GrammarDetailCard grammar={grammarData} onClose={closeGrammar} />;
  if (isNoteVisible) return <NoteDetailCard note={noteData} onClose={closeNote} />;

  return (
    <div className="help-btn-margin relative flex w-full grow flex-col items-center">
      <div className="card-width card-height relative gap-1">
        <button
          type="button"
          className={`relative flex h-full w-full grow cursor-pointer flex-col items-center justify-between p-4 text-inherit select-none ${cardStyle} `}
          onClick={handleReveal}
          title={cardText}
          aria-disabled={revealed}
        >
          {!revealed && !showDirectionChange && (
            <HelpText className="center top-4">{TEXTS.reveal}</HelpText>
          )}
          <div id="top-bar" className="relative flex h-8 w-full items-center justify-end">
            {audioStatusMessage}
          </div>
          {showDirectionChange ? (
            <Notification className="my-auto">{directionText}</Notification>
          ) : (
            <div id="item" className="flex h-full flex-col justify-center gap-1">
              <p className="text-center font-bold">{czech}</p>
              <p className="text-center font-normal">{english}</p>
              <p className="text-center font-normal">{pronunciation}</p>
            </div>
          )}

          <div className="relative flex h-8 w-full items-center justify-between" id="bottom-bar">
            <p className="px-2 font-light" title={TEXTS.progress}>
              {progressLabel}
            </p>
            <HelpText className="bottom-7.5">{TEXTS.progress}</HelpText>
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
          </div>
        </button>
        <div
          id="practice-controls"
          className={`relative grid w-full gap-1 ${revealed ? 'grid-cols-3' : 'grid-cols-1'}`}
        >
          {revealed ? (
            <>
              <MasterItemButton
                onConfirm={() => {
                  void completeCurrent?.();
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
          ) : (
            <HintButton onClick={plusHint} disabled={showDirectionChange} />
          )}
        </div>

        {showAudioControls && (
          <div className="pos-bottom-left-control">
            <PlayButton onClick={playAudio} disabled={showDirectionChange || audioLoading} />
            <VolumeSlider />
          </div>
        )}
        <div className="pos-bottom-right-control">
          {showGrammarButton && (
            <SecondaryControlButton
              title={TEXTS.grammar}
              ariaLabel={TEXTS.grammar}
              onClick={() => openGrammar(grammarId)}
              disabled={showDirectionChange}
            >
              <BookIcon />
            </SecondaryControlButton>
          )}
          {!showNoteButton && (
            <InfoButton
              className="note-control-emphasis"
              title={TEXTS.tooltipNotes}
              onClick={(e) => {
                e.stopPropagation();
                openNote(noteId);
              }}
            />
          )}
          <HelpButton />
        </div>
      </div>
    </div>
  );
}
