import Notification from '@/components/UI/Notification';
import DelayedNotification from '@/components/UI/DelayedNotification';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import BookIcon from '@/components/UI/icons/BookIcon';
import PlayButton from '@/features/audio/PlayButton';
import VolumeSlider from '@/features/audio/VolumeSlider';
import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import InfoButton from '@/features/notes/InfoButton';
import NoteDetailCard from '@/features/notes/NoteDetailCard';
import { TEXTS } from '@/locales/cs';
import HintButton from './buttons/HintButton';
import KnownButton from './buttons/KnownButton';
import MasterItemButton from './buttons/MasterItemButton';
import RepeatButton from './buttons/RepeatButton';
import PronunciationToggleButton from '@/features/pronunciation/PronunciationToggleButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import type { UserItemLocal } from '@/types/user-item.types';
import RightArrowIcon from '@/components/UI/icons/RightArrowIcon';
import ControlButton from './buttons/ControlButton';
import { usePointerReleaseLock } from './hooks/use-pointer-release-lock';
import type { GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import type { NoteType } from '@/types/generic.types';
import { useState, type MouseEvent } from 'react';

export type PracticeSessionCardProps = Readonly<{
  note: NoteType | null;
  grammar: GrammarChunkWithExamples | null;
  progressLabel: string | number;
  progressHelpText?: string;
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
  isCompletion?: boolean;
  onCompletionContinue?: () => void;
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
> &
  Readonly<{
    controlsLocked: boolean;
    showHintControl: boolean;
  }>;

type VisibleDetail = 'grammar' | 'note';

type PracticeDetailProps = Readonly<{
  visibleDetail: VisibleDetail;
  grammar: GrammarChunkWithExamples | null;
  note: NoteType | null;
  onClose: () => void;
}>;

function PracticeDetail({ visibleDetail, grammar, note, onClose }: PracticeDetailProps) {
  if (visibleDetail === 'grammar') {
    return (
      <GrammarDetailCard
        grammar={grammar ? { ...grammar, kind: 'chunk' } : null}
        onClose={onClose}
        showHelpButton={false}
      />
    );
  }

  return <NoteDetailCard note={note} onClose={onClose} />;
}

function AudioStatusMessage({
  audioError,
  audioLoading,
  className = '',
}: Pick<PracticeSessionCardProps, 'audioError' | 'audioLoading'> & { className?: string }) {
  if (audioLoading) {
    return (
      <div className={className}>
        <DelayedNotification message={TEXTS.loadingAudio} />
      </div>
    );
  }
  if (audioError) {
    return (
      <div className={className}>
        <p className="font-headings text-lg">{TEXTS.noAudio}</p>
      </div>
    );
  }
  return null;
}

function DirectionTopBar({
  shortDirectionText,
  audioError,
  audioLoading,
}: Readonly<{
  shortDirectionText: string;
  audioError: boolean;
  audioLoading: boolean;
}>) {
  return (
    <div className="relative">
      <p className="text-sm font-light">{shortDirectionText}</p>
      <AudioStatusMessage
        audioError={audioError}
        audioLoading={audioLoading}
        className="absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap"
      />
      <HelpText className="top-4 left-1/2 -translate-x-1/2">{TEXTS.directionHelpText}</HelpText>
    </div>
  );
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
  controlsLocked,
  showHintControl,
}: PracticeControlsProps) {
  const { isLocked: isSkipGestureLocked, lockUntilRelease: lockHintUntilRelease } =
    usePointerReleaseLock();

  if (showHintControl) {
    return <HintButton onClick={plusHint} disabled={controlsLocked || isSkipGestureLocked} />;
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
        disabled={completeDisabled || !completeCurrent || controlsLocked}
      />
      <RepeatButton
        onClick={() => {
          void nextRepeat();
        }}
        disabled={repeatDisabled || controlsLocked}
      />
      <KnownButton
        onClick={() => {
          void nextKnown();
        }}
        disabled={controlsLocked}
      />
    </>
  );
}

type PracticeMainContentProps = Readonly<{
  showDirectionChange: boolean;
  isCompletion: boolean;
  isBlockTrainingPractice: boolean;
  directionText: string;
  czech: string | undefined;
  english: string | undefined;
  pronunciation: string | undefined;
}>;

function PracticeMainContent({
  showDirectionChange,
  isCompletion,
  isBlockTrainingPractice,
  directionText,
  czech,
  english,
  pronunciation,
}: PracticeMainContentProps) {
  if (isCompletion) {
    return (
      <Notification role="status">
        <span className="block">{getCompletionLabel(isBlockTrainingPractice)}</span>
        <span className="block">{TEXTS.returnToHomeByClick}</span>
      </Notification>
    );
  }
  if (showDirectionChange) {
    return <Notification>{directionText}</Notification>;
  }

  return (
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
  );
}

type NormalizedPracticeSessionCardProps = PracticeSessionCardProps &
  Readonly<{
    progressHelpText: string;
    repeatDisabled: boolean;
    completeDisabled: boolean;
    isBlockTrainingPractice: boolean;
    isPronunciationPractice: boolean;
    pronunciationItem: UserItemLocal | null;
  }>;

const DEFAULT_PRACTICE_SESSION_CARD_PROPS = {
  progressHelpText: TEXTS.progress,
  repeatDisabled: false,
  completeDisabled: false,
  isBlockTrainingPractice: false,
  isPronunciationPractice: false,
  pronunciationItem: null,
} as const;

function normalizePracticeSessionCardProps(
  props: PracticeSessionCardProps,
): NormalizedPracticeSessionCardProps {
  return { ...DEFAULT_PRACTICE_SESSION_CARD_PROPS, ...props } as NormalizedPracticeSessionCardProps;
}

type PracticeCardDisplayState = Readonly<{
  cardText: string | undefined;
  cardStyle: string;
  directionText: string;
  shortDirectionText: string;
  showAudioControls: boolean;
  showGrammarButton: boolean;
  showNoteButton: boolean;
  audioControlsDisabled: boolean;
  grammarButtonDisabled: boolean;
  noteButtonDisabled: boolean;
  controlsLocked: boolean;
  showHintControl: boolean;
  practiceControlColumns: string;
  showTopBar: boolean;
  showRevealHelp: boolean;
}>;

function getPracticeCardDisplayState(
  props: NormalizedPracticeSessionCardProps,
): PracticeCardDisplayState {
  const {
    grammar,
    note,
    isCzToEn,
    revealed,
    audioDisabled,
    showDirectionChange,
    audioLoading,
    isCompletion,
    isPronunciationPractice,
  } = props;
  const controlsLocked = isCompletion || showDirectionChange;
  const showAudioControls = !audioDisabled;
  const showGrammarButton = hasGrammarDetails(revealed, grammar);
  const showNoteButton = hasNoteDetails(revealed, note);
  return {
    cardText: getPracticeCardText(revealed),
    cardStyle: getPracticeCardStyle(controlsLocked, revealed),
    directionText: getDirectionText(isCzToEn),
    shortDirectionText: getShortDirectionText(isCzToEn),
    showAudioControls,
    showGrammarButton,
    showNoteButton,
    audioControlsDisabled: isAudioControlDisabled(
      controlsLocked,
      showAudioControls,
      showDirectionChange,
      audioLoading,
      isCzToEn,
      revealed,
    ),
    grammarButtonDisabled: controlsLocked || !showGrammarButton,
    noteButtonDisabled: controlsLocked || !showNoteButton,
    controlsLocked,
    showHintControl: !revealed || controlsLocked,
    practiceControlColumns: getPracticeControlColumns(
      !revealed || controlsLocked,
      isPronunciationPractice,
    ),
    showTopBar: !isPronunciationPractice && !isCompletion,
    showRevealHelp: !revealed && !controlsLocked,
  };
}

function getPracticeCardText(revealed: boolean): string | undefined {
  if (revealed) return undefined;
  return TEXTS.reveal;
}

function getPracticeCardStyle(controlsLocked: boolean, revealed: boolean): string {
  if (controlsLocked || !revealed) return 'color-button';
  return 'color-audio-disabled';
}

function getDirectionText(isCzToEn: boolean): string {
  if (isCzToEn) return TEXTS.directionCzToEn;
  return TEXTS.directionEnToCz;
}

function getShortDirectionText(isCzToEn: boolean): string {
  if (isCzToEn) return TEXTS.directionCzToEnShort;
  return TEXTS.directionEnToCzShort;
}

function hasGrammarDetails(revealed: boolean, grammar: GrammarChunkWithExamples | null): boolean {
  if (!revealed || !grammar) return false;
  return Boolean(grammar.note?.trim() || grammar.items.length);
}

function hasNoteDetails(revealed: boolean, note: NoteType | null): boolean {
  if (!revealed || !note) return false;
  return Boolean(note.note.trim());
}

function isAudioControlDisabled(
  celebrationLocked: boolean,
  showAudioControls: boolean,
  showDirectionChange: boolean,
  audioLoading: boolean,
  isCzToEn: boolean,
  revealed: boolean,
): boolean {
  return [
    celebrationLocked,
    !showAudioControls,
    showDirectionChange,
    audioLoading,
    isCzToEn && !revealed,
  ].some(Boolean);
}

function getPracticeControlColumns(
  showHintControl: boolean,
  isPronunciationPractice: boolean,
): string {
  if (!showHintControl && !isPronunciationPractice) return 'grid-cols-3';
  return 'grid-cols-1';
}

function openGrammarDetail(
  grammar: GrammarChunkWithExamples | null,
  disabled: boolean,
  setVisibleDetail: (detail: VisibleDetail) => void,
): void {
  if (!grammar || disabled) return;
  setVisibleDetail('grammar');
}

function openNoteDetail(
  event: MouseEvent,
  note: NoteType | null,
  disabled: boolean,
  setVisibleDetail: (detail: VisibleDetail) => void,
): void {
  event.stopPropagation();
  if (!note || disabled) return;
  setVisibleDetail('note');
}

function PracticeCardButton({
  props,
  display,
}: Readonly<{
  props: NormalizedPracticeSessionCardProps;
  display: PracticeCardDisplayState;
}>) {
  const {
    isCompletion,
    onCompletionContinue,
    handleReveal,
    revealed,
    showDirectionChange,
    czech,
    english,
    pronunciation,
    progressLabel,
    progressHelpText,
    isBlockTrainingPractice,
    audioError,
    audioLoading,
  } = props;
  return (
    <button
      type="button"
      className={`relative flex h-full w-full grow cursor-pointer flex-col items-center p-4 text-inherit select-none ${display.cardStyle}`}
      onClick={isCompletion ? onCompletionContinue : handleReveal}
      title={isCompletion ? getCompletionLabel(isBlockTrainingPractice) : display.cardText}
      aria-label={isCompletion ? getCompletionLabel(isBlockTrainingPractice) : undefined}
      aria-disabled={revealed && !isCompletion}
    >
      {display.showRevealHelp && (
        <HelpText className="top-23 left-1/2 -translate-x-1/2">{TEXTS.reveal}</HelpText>
      )}
      {display.showTopBar && (
        <div
          id="top-bar"
          className="relative flex h-8 w-full shrink-0 items-center justify-center text-center"
        >
          <DirectionTopBar
            shortDirectionText={display.shortDirectionText}
            audioError={audioError}
            audioLoading={audioLoading}
          />
        </div>
      )}
      <div
        id="practice-main-content"
        className="flex min-h-0 w-full grow items-center justify-center"
      >
        <PracticeMainContent
          showDirectionChange={showDirectionChange}
          isCompletion={Boolean(isCompletion)}
          isBlockTrainingPractice={isBlockTrainingPractice}
          directionText={display.directionText}
          czech={czech}
          english={english}
          pronunciation={pronunciation}
        />
        {!display.showTopBar && (
          <AudioStatusMessage audioError={audioError} audioLoading={audioLoading} />
        )}
      </div>
      <div
        className="relative flex h-8 w-full shrink-0 items-center justify-between"
        id="bottom-bar"
      >
        <p className="min-w-14 px-2 text-right font-light" title={progressHelpText}>
          {progressLabel}
        </p>
        {!isCompletion && (
          <HelpText className="bottom-7.5">
            {getPracticeProgressHelp(isBlockTrainingPractice, progressHelpText)}
          </HelpText>
        )}
      </div>
    </button>
  );
}

function getPracticeProgressHelp(
  isBlockTrainingPractice: boolean,
  progressHelpText: string,
): string {
  if (isBlockTrainingPractice) return TEXTS.blockTrainingProgressHelp;
  return progressHelpText;
}

function getCompletionLabel(isBlockTrainingPractice: boolean): string {
  if (isBlockTrainingPractice) return TEXTS.blockCompleted;
  return TEXTS.reviewCompleted;
}

function PracticeCardActionBar({
  props,
  display,
  userId,
  setVisibleDetail,
}: Readonly<{
  props: NormalizedPracticeSessionCardProps;
  display: PracticeCardDisplayState;
  userId: string | null;
  setVisibleDetail: (detail: VisibleDetail) => void;
}>) {
  const {
    grammar,
    note,
    playAudio,
    pronunciationItem,
    onPronunciationSelectionChange,
    completeCurrent,
    completeDisabled,
    isPronunciationPractice,
    nextKnown,
    nextPronunciation,
    nextRepeat,
    plusHint,
    repeatDisabled,
  } = props;
  return (
    <>
      <div
        id="practice-controls"
        className={`relative grid w-full gap-1 ${display.practiceControlColumns}`}
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
          controlsLocked={display.controlsLocked}
          showHintControl={display.showHintControl}
        />
      </div>
      <div className="pos-bottom-left-control">
        <PlayButton onClick={playAudio} disabled={display.audioControlsDisabled} />
        <VolumeSlider disabled={display.audioControlsDisabled} />
        <PronunciationToggleButton
          userId={userId}
          item={pronunciationItem}
          disabled={display.controlsLocked}
          showHelpText
          onSelectionChange={onPronunciationSelectionChange}
        />
      </div>
      <div className="pos-bottom-right-control">
        <SecondaryControlButton
          title={TEXTS.grammar}
          ariaLabel={TEXTS.grammar}
          onClick={() =>
            openGrammarDetail(grammar, display.grammarButtonDisabled, setVisibleDetail)
          }
          disabled={display.grammarButtonDisabled}
        >
          <BookIcon />
          <HelpText className="-right-6 bottom-10 flex flex-col items-end landscape:invisible">
            {TEXTS.grammar}
          </HelpText>
        </SecondaryControlButton>
        <InfoButton
          title={TEXTS.tooltipNotes}
          disabled={display.noteButtonDisabled}
          onClick={(event) =>
            openNoteDetail(event, note, display.noteButtonDisabled, setVisibleDetail)
          }
        >
          <HelpText className="-bottom-4 left-0 flex flex-col items-end landscape:invisible">
            {TEXTS.tooltipNotes}
          </HelpText>
        </InfoButton>
        <HelpButton />
      </div>
    </>
  );
}

function PracticeSessionCardView({
  props,
  userId,
  setVisibleDetail,
}: Readonly<{
  props: NormalizedPracticeSessionCardProps;
  userId: string | null;
  setVisibleDetail: (detail: VisibleDetail) => void;
}>) {
  const display = getPracticeCardDisplayState(props);
  return (
    <div className="bottom-controls-clearance relative flex min-h-0 w-full grow flex-col items-center">
      <div className="card-width card-height relative gap-1" aria-busy={props.isCompletion}>
        <PracticeCardButton props={props} display={display} />
        <PracticeCardActionBar
          props={props}
          display={display}
          userId={userId}
          setVisibleDetail={setVisibleDetail}
        />
      </div>
    </div>
  );
}

export default function PracticeSessionCard(props: PracticeSessionCardProps) {
  const normalizedProps = normalizePracticeSessionCardProps(props);
  const userId = useAuthStore((state) => state.userId);
  const [visibleDetail, setVisibleDetail] = useState<VisibleDetail | null>(null);

  if (visibleDetail) {
    return (
      <PracticeDetail
        visibleDetail={visibleDetail}
        grammar={normalizedProps.grammar}
        note={normalizedProps.note}
        onClose={() => setVisibleDetail(null)}
      />
    );
  }

  return (
    <PracticeSessionCardView
      props={normalizedProps}
      userId={userId}
      setVisibleDetail={(detail) => setVisibleDetail(detail)}
    />
  );
}
