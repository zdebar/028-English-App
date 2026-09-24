import DelayedNotification from '@/components/UI/DelayedNotification';
import config from '@/config/config';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import StyledButton from '@/components/UI/buttons/StyledButton';
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
import { usePointerReleaseLock } from './hooks/use-pointer-release-lock';
import type { GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import type { NoteType } from '@/types/generic.types';
import { useEffect, useRef, useState, type MouseEvent } from 'react';

export type PracticeDetail = 'grammar' | 'note';

export type PracticeSessionCardProps = Readonly<{
  note: NoteType | null;
  grammar: GrammarChunkWithExamples | null;
  noteAvailable?: boolean;
  grammarAvailable?: boolean;
  noteLoadFailed?: boolean;
  grammarLoadFailed?: boolean;
  itemKey?: string;
  ensureDetailLoaded?: (detail: PracticeDetail) => Promise<boolean>;
  onDetailLoadError?: (detail: PracticeDetail) => void;
  progressLabel: string | number;
  progressHelpText?: string;
  revealed: boolean;
  czech: string | undefined;
  english: string | undefined;
  pronunciation: string | undefined;
  audioDisabled: boolean;
  handleReveal: () => void;
  plusHint: () => void;
  nextRepeat: () => void | Promise<void>;
  repeatDisabled?: boolean;
  nextKnown: () => void | Promise<void>;
  completeCurrent?: () => void | Promise<void>;
  completeDisabled?: boolean;
  retryAction?: () => void | Promise<void>;
  audioError: boolean;
  playAudio: () => void;
  audioLoading: boolean;
  isBlockTrainingPractice?: boolean;
  showProgressLabel?: boolean;
  isContentLoading?: boolean;
}>;

type PracticeControlsProps = Pick<
  PracticeSessionCardProps,
  | 'completeCurrent'
  | 'completeDisabled'
  | 'nextKnown'
  | 'nextRepeat'
  | 'plusHint'
  | 'repeatDisabled'
  | 'retryAction'
> &
  Readonly<{
    controlsLocked: boolean;
    showHintControl: boolean;
  }>;

type PracticeDetailProps = Readonly<{
  visibleDetail: PracticeDetail;
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
  audioError,
  audioLoading,
}: Readonly<{
  audioError: boolean;
  audioLoading: boolean;
}>) {
  return (
    <div className="relative">
      <AudioStatusMessage
        audioError={audioError}
        audioLoading={audioLoading}
        className="absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap"
      />
    </div>
  );
}

function PracticeControls({
  completeCurrent,
  completeDisabled = false,
  nextKnown,
  nextRepeat,
  plusHint,
  repeatDisabled = false,
  retryAction,
  controlsLocked,
  showHintControl,
}: PracticeControlsProps) {
  const { isLocked: isSkipGestureLocked, lockUntilRelease: lockHintUntilRelease } =
    usePointerReleaseLock();

  if (showHintControl) {
    return <HintButton onClick={plusHint} disabled={controlsLocked || isSkipGestureLocked} />;
  }

  if (retryAction) {
    return (
      <StyledButton
        className="h-button max-h-button w-full px-4 col-span-full"
        onClick={() => void retryAction()}
      >
        {TEXTS.retry}
      </StyledButton>
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
  czech: string | undefined;
  english: string | undefined;
  pronunciation: string | undefined;
  isContentLoading: boolean;
}>;

function PracticeMainContent({
  czech,
  english,
  pronunciation,
  isContentLoading,
}: PracticeMainContentProps) {
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  useEffect(() => {
    if (!isContentLoading) {
      setShowLoadingMessage(false);
      return undefined;
    }

    const timeoutId = globalThis.setTimeout(
      () => setShowLoadingMessage(true),
      config.loading.dataStateDelayMs,
    );
    return () => globalThis.clearTimeout(timeoutId);
  }, [isContentLoading]);

  if (isContentLoading && showLoadingMessage) {
    return (
      <p className="text-center font-normal" aria-live="polite">
        {TEXTS.loadingMessage}
      </p>
    );
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
    showProgressLabel: boolean;
  }>;

const DEFAULT_PRACTICE_SESSION_CARD_PROPS = {
  progressHelpText: TEXTS.progress,
  repeatDisabled: false,
  completeDisabled: false,
  isBlockTrainingPractice: false,
  showProgressLabel: false,
} as const;

function normalizePracticeSessionCardProps(
  props: PracticeSessionCardProps,
): NormalizedPracticeSessionCardProps {
  return { ...DEFAULT_PRACTICE_SESSION_CARD_PROPS, ...props } as NormalizedPracticeSessionCardProps;
}

type PracticeCardDisplayState = Readonly<{
  cardText: string | undefined;
  cardStyle: string;
  showGrammarButton: boolean;
  showNoteButton: boolean;
  showProgressLabel: boolean;
  audioButtonDisabled: boolean;
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
    grammarAvailable,
    grammarLoadFailed = false,
    noteAvailable,
    noteLoadFailed = false,
    revealed,
    audioDisabled,
    audioLoading,
  } = props;
  const controlsLocked = false;
  const showAudioControls = !audioDisabled;
  const audioControlsDisabled = isAudioControlDisabled(
    controlsLocked,
    showAudioControls,
    audioLoading,
  );
  const showGrammarButton = hasGrammarReference(revealed, grammar, grammarAvailable);
  const showNoteButton = hasNoteReference(revealed, note, noteAvailable);
  return {
    cardText: getPracticeCardText(revealed),
    cardStyle: getPracticeCardStyle(controlsLocked, revealed),
    showGrammarButton,
    showNoteButton,
    showProgressLabel: props.isBlockTrainingPractice || props.showProgressLabel,
    audioButtonDisabled: audioControlsDisabled || !revealed,
    grammarButtonDisabled: controlsLocked || grammarLoadFailed || !showGrammarButton,
    noteButtonDisabled: controlsLocked || noteLoadFailed || !showNoteButton,
    controlsLocked,
    showHintControl: !revealed,
    practiceControlColumns: getPracticeControlColumns(!revealed),
    showTopBar: true,
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

function hasGrammarReference(
  revealed: boolean,
  grammar: GrammarChunkWithExamples | null,
  grammarAvailable: boolean | undefined,
): boolean {
  if (!revealed) return false;
  if (grammarAvailable !== undefined) return grammarAvailable;
  return hasGrammarDetails(grammar);
}

function hasGrammarDetails(grammar: GrammarChunkWithExamples | null): boolean {
  if (!grammar) return false;
  return Boolean(grammar.note?.trim() || grammar.items.length);
}

function hasNoteReference(
  revealed: boolean,
  note: NoteType | null,
  noteAvailable: boolean | undefined,
): boolean {
  if (!revealed) return false;
  if (noteAvailable !== undefined) return noteAvailable;
  return hasNoteDetails(note);
}

function hasNoteDetails(note: NoteType | null): boolean {
  if (!note) return false;
  return Boolean(note.note.trim());
}

function isAudioControlDisabled(
  celebrationLocked: boolean,
  showAudioControls: boolean,
  audioLoading: boolean,
): boolean {
  return celebrationLocked || !showAudioControls || audioLoading;
}

function getPracticeControlColumns(
  showHintControl: boolean,
): string {
  if (!showHintControl) return 'grid-cols-3';
  return 'grid-cols-1';
}

async function openGrammarDetail(
  grammar: GrammarChunkWithExamples | null,
  disabled: boolean,
  ensureDetailLoaded: PracticeSessionCardProps['ensureDetailLoaded'],
  onDetailLoadError: PracticeSessionCardProps['onDetailLoadError'],
  setVisibleDetail: (detail: PracticeDetail) => void,
): Promise<void> {
  if (disabled) return;
  if (grammar) {
    setVisibleDetail('grammar');
    return;
  }
  if (!ensureDetailLoaded) return;

  const loaded = await ensureDetailLoaded('grammar');
  if (loaded) {
    setVisibleDetail('grammar');
    return;
  }
  onDetailLoadError?.('grammar');
}

async function openNoteDetail(
  event: MouseEvent,
  note: NoteType | null,
  disabled: boolean,
  ensureDetailLoaded: PracticeSessionCardProps['ensureDetailLoaded'],
  onDetailLoadError: PracticeSessionCardProps['onDetailLoadError'],
  setVisibleDetail: (detail: PracticeDetail) => void,
): Promise<void> {
  event.stopPropagation();
  if (disabled) return;
  if (note) {
    setVisibleDetail('note');
    return;
  }
  if (!ensureDetailLoaded) return;

  const loaded = await ensureDetailLoaded('note');
  if (loaded) {
    setVisibleDetail('note');
    return;
  }
  onDetailLoadError?.('note');
}

function PracticeCardButton({
  props,
  display,
}: Readonly<{
  props: NormalizedPracticeSessionCardProps;
  display: PracticeCardDisplayState;
}>) {
  const {
    handleReveal,
    revealed,
    czech,
    english,
    pronunciation,
    progressLabel,
    progressHelpText,
    audioError,
    audioLoading,
  } = props;
  return (
    <button
      type="button"
      className={`relative flex h-full w-full grow cursor-pointer flex-col items-center p-4 text-inherit select-none ${display.cardStyle}`}
      onClick={handleReveal}
      title={display.cardText}
      aria-disabled={revealed}
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
          czech={czech}
          english={english}
          pronunciation={pronunciation}
          isContentLoading={props.isContentLoading ?? false}
        />
        {!display.showTopBar && (
          <AudioStatusMessage audioError={audioError} audioLoading={audioLoading} />
        )}
      </div>
      <div
        className="relative flex h-8 w-full shrink-0 items-center justify-between"
        id="bottom-bar"
      >
        {display.showProgressLabel && (
          <>
            <p className="min-w-12 pl-2 text-right font-light" title={progressHelpText}>
              {progressLabel}
            </p>
            {props.isBlockTrainingPractice && (
              <HelpText className="bottom-7.5">{TEXTS.blockTrainingProgressHelp}</HelpText>
            )}
          </>
        )}
      </div>
    </button>
  );
}

function PracticeCardActionBar({
  props,
  display,
  setVisibleDetail,
  onDetailLoadError,
}: Readonly<{
  props: NormalizedPracticeSessionCardProps;
  display: PracticeCardDisplayState;
  setVisibleDetail: (detail: PracticeDetail) => void;
  onDetailLoadError: (detail: PracticeDetail) => void;
}>) {
  const {
    grammar,
    note,
    ensureDetailLoaded,
    playAudio,
    completeCurrent,
    completeDisabled,
    nextKnown,
    nextRepeat,
    plusHint,
    repeatDisabled,
    retryAction,
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
          nextKnown={nextKnown}
          nextRepeat={nextRepeat}
          plusHint={plusHint}
          repeatDisabled={repeatDisabled}
          retryAction={retryAction}
          controlsLocked={display.controlsLocked}
          showHintControl={display.showHintControl}
        />
      </div>
      <div className="pos-bottom-left-control">
        <PlayButton onClick={playAudio} disabled={display.audioButtonDisabled} />
        <VolumeSlider />
      </div>
      <div className="pos-bottom-right-control">
        <SecondaryControlButton
          title={TEXTS.grammar}
          ariaLabel={TEXTS.grammar}
          onClick={() =>
            void openGrammarDetail(
              grammar,
              display.grammarButtonDisabled,
              ensureDetailLoaded,
              onDetailLoadError,
              setVisibleDetail,
            )
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
            void openNoteDetail(
              event,
              note,
              display.noteButtonDisabled,
              ensureDetailLoaded,
              onDetailLoadError,
              setVisibleDetail,
            )
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
  setVisibleDetail,
  onDetailLoadError,
}: Readonly<{
  props: NormalizedPracticeSessionCardProps;
  setVisibleDetail: (detail: PracticeDetail) => void;
  onDetailLoadError: (detail: PracticeDetail) => void;
}>) {
  const display = getPracticeCardDisplayState(props);
  return (
    <div className="bottom-controls-clearance relative flex min-h-0 w-full grow flex-col items-center">
      <div className="card-width card-height relative gap-1">
        <PracticeCardButton props={props} display={display} />
        <PracticeCardActionBar
          props={props}
          display={display}
          setVisibleDetail={setVisibleDetail}
          onDetailLoadError={onDetailLoadError}
        />
      </div>
    </div>
  );
}

export default function PracticeSessionCard(props: PracticeSessionCardProps) {
  const normalizedProps = normalizePracticeSessionCardProps(props);
  const [visibleDetail, setVisibleDetail] = useState<PracticeDetail | null>(null);
  const reportedDetailFailuresRef = useRef(new Set<string>());

  useEffect(() => {
    reportedDetailFailuresRef.current.clear();
  }, [normalizedProps.itemKey]);

  const handleDetailLoadError = (detail: PracticeDetail): void => {
    const failureKey = `${normalizedProps.itemKey ?? 'current'}:${detail}`;
    if (reportedDetailFailuresRef.current.has(failureKey)) return;
    reportedDetailFailuresRef.current.add(failureKey);
    normalizedProps.onDetailLoadError?.(detail);
  };

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
      setVisibleDetail={(detail) => setVisibleDetail(detail)}
      onDetailLoadError={handleDetailLoadError}
    />
  );
}
