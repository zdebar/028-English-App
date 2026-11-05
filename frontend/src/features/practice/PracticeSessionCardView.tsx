import DelayedNotification from '@/components/UI/DelayedNotification';
import HelpText from '@/features/help/HelpText';
import config from '@/config/config';
import { TEXTS } from '@/locales/cs';
import {
  getSoundsFromPronunciationSegments,
  getUniquePronunciationSounds,
  splitPronunciationIntoSegments,
  type PronunciationSegment,
} from '@/features/pronunciation/pronunciation.utils';
import type { GroupType } from '@/types/table.types';
import { useEffect, useState } from 'react';
import PracticeSessionCardControls from './PracticeSessionCardControls';
import type {
  NormalizedPracticeSessionCardProps,
  PracticeCardDisplayState,
  PracticeDetail,
} from './practice-session-card.types';

type PracticeSessionCardViewProps = Readonly<{
  props: NormalizedPracticeSessionCardProps;
  sounds: readonly GroupType[];
  setVisibleDetail: (detail: PracticeDetail) => void;
  onDetailLoadError: (detail: PracticeDetail) => void;
  onOpenPronunciation: (segments: readonly PronunciationSegment[]) => void;
}>;

// -- Public practice card view --
export default function PracticeSessionCardView({
  props,
  sounds,
  setVisibleDetail,
  onDetailLoadError,
  onOpenPronunciation,
}: PracticeSessionCardViewProps) {
  const pronunciationSegments = splitPronunciationIntoSegments(props.pronunciation ?? '', sounds);
  const pronunciationSounds = getSoundsFromPronunciationSegments(pronunciationSegments);
  const uniquePronunciationSounds = getUniquePronunciationSounds(pronunciationSounds);
  const display = getPracticeCardDisplayState(props, uniquePronunciationSounds.length > 0);

  return (
    <div className="bottom-controls-clearance relative flex min-h-0 w-full grow flex-col items-center">
      <div className="card-width card-height relative gap-1">
        <PracticeCardFace props={props} display={display} />
        <PracticeSessionCardControls
          props={props}
          display={display}
          setVisibleDetail={setVisibleDetail}
          onDetailLoadError={onDetailLoadError}
          pronunciationSegments={pronunciationSegments}
          onOpenPronunciation={onOpenPronunciation}
        />
      </div>
    </div>
  );
}

// -- Card faces and content --
function PracticeCardFace({
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
    itemProgressLabel,
    progressLabel,
    itemProgressHelpText,
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
          <DirectionTopBar audioError={audioError} audioLoading={audioLoading} />
        </div>
      )}
      <div
        id="practice-main-content"
        className="flex min-h-0 w-full grow items-center justify-center"
      >
        <PracticeMainContent
          czech={czech}
          czechDescription={props.czechDescription}
          czechHidden={props.czechHidden}
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
        <div className="relative min-w-12 pl-2">
          <p className="font-light" title={itemProgressHelpText}>
            {itemProgressLabel}
          </p>
          <HelpText className="pos-help-above-left whitespace-nowrap">{itemProgressHelpText}</HelpText>
        </div>
        {display.showProgressLabel && (
          <div className="relative min-w-12 pr-2 text-right">
            <p className="font-light" title={progressHelpText}>
              {progressLabel}
            </p>
            <HelpText className="pos-help-above-right whitespace-nowrap">{progressHelpText}</HelpText>
          </div>
        )}
      </div>
    </button>
  );
}

function PracticeMainContent({
  czech,
  czechDescription,
  czechHidden,
  english,
  pronunciation,
  isContentLoading,
}: Readonly<{
  czech: string | undefined;
  czechDescription: string | null | undefined;
  czechHidden: boolean;
  english: string | undefined;
  pronunciation: string | undefined;
  isContentLoading: boolean;
}>) {
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
      <p lang="cs" className={`text-center font-bold ${czechHidden ? 'invisible' : ''}`}>
        {czech}
      </p>
      {czechDescription && (
        <p lang="cs" className={`text-center text-sm font-light ${czechHidden ? 'invisible' : ''}`}>
          {czechDescription}
        </p>
      )}
      <p lang="en" translate="no" className="text-center font-normal">
        {english}
      </p>
      <p translate="no" className="text-center font-normal">
        {pronunciation}
      </p>
    </div>
  );
}

function AudioStatusMessage({
  audioError,
  audioLoading,
  className = '',
}: Readonly<{
  audioError: boolean;
  audioLoading: boolean;
  className?: string;
}>) {
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

// -- Display and control-state selectors --
function getPracticeCardDisplayState(
  props: NormalizedPracticeSessionCardProps,
  hasPronunciationSounds: boolean,
): PracticeCardDisplayState {
  const {
    grammar,
    note,
    grammarAvailable,
    noteAvailable,
    revealed,
    audioDisabled,
  } = props;
  const controlsLocked = false;
  const showAudioControls = !audioDisabled;
  const audioControlsDisabled = isAudioControlDisabled(controlsLocked, showAudioControls);
  const showGrammarButton = hasGrammarReference(revealed, grammar, grammarAvailable);
  const showNoteButton = hasNoteReference(revealed, note, noteAvailable);
  const detailButtons = getDetailButtonState(props, controlsLocked, showGrammarButton, showNoteButton);
  return {
    cardText: getPracticeCardText(revealed),
    cardStyle: getPracticeCardStyle(controlsLocked, revealed),
    showGrammarButton,
    showNoteButton,
    pronunciationButtonDisabled: shouldDisablePronunciationButton(
      revealed,
      hasPronunciationSounds,
    ),
    showProgressLabel: props.isInitialTrainingPractice || props.showProgressLabel,
    audioButtonDisabled: getAudioButtonDisabled(props, audioControlsDisabled),
    grammarButtonDisabled: detailButtons.grammarButtonDisabled,
    noteButtonDisabled: detailButtons.noteButtonDisabled,
    controlsLocked,
    showHintControl: !revealed,
    practiceControlColumns: getPracticeControlColumns(!revealed),
    showTopBar: true,
    showRevealHelp: !revealed && !controlsLocked,
  };
}

function getDetailButtonState(
  props: NormalizedPracticeSessionCardProps,
  controlsLocked: boolean,
  showGrammarButton: boolean,
  showNoteButton: boolean,
): Readonly<{ grammarButtonDisabled: boolean; noteButtonDisabled: boolean }> {
  return {
    grammarButtonDisabled:
      controlsLocked || props.grammarLoadFailed === true || !showGrammarButton,
    noteButtonDisabled: controlsLocked || props.noteLoadFailed === true || !showNoteButton,
  };
}

function getAudioButtonDisabled(
  props: NormalizedPracticeSessionCardProps,
  audioControlsDisabled: boolean,
): boolean {
  if (audioControlsDisabled) return true;
  return !props.revealed && !props.czechHidden;
}

function shouldDisablePronunciationButton(revealed: boolean, hasPronunciationSounds: boolean): boolean {
  return !revealed || !hasPronunciationSounds;
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
  grammar: NormalizedPracticeSessionCardProps['grammar'],
  grammarAvailable: boolean | undefined,
): boolean {
  if (!revealed) return false;
  if (grammarAvailable !== undefined) return grammarAvailable;
  return hasGrammarDetails(grammar);
}

function hasGrammarDetails(grammar: NormalizedPracticeSessionCardProps['grammar']): boolean {
  if (!grammar) return false;
  return Boolean(grammar.note?.trim() || grammar.items.length);
}

function hasNoteReference(
  revealed: boolean,
  note: NormalizedPracticeSessionCardProps['note'],
  noteAvailable: boolean | undefined,
): boolean {
  if (!revealed) return false;
  if (noteAvailable !== undefined) return noteAvailable;
  return hasNoteDetails(note);
}

function hasNoteDetails(note: NormalizedPracticeSessionCardProps['note']): boolean {
  if (!note) return false;
  return Boolean(note.note.trim());
}

function isAudioControlDisabled(
  celebrationLocked: boolean,
  showAudioControls: boolean,
): boolean {
  return celebrationLocked || !showAudioControls;
}

function getPracticeControlColumns(showHintControl: boolean): string {
  if (!showHintControl) return 'grid-cols-3';
  return 'grid-cols-1';
}
