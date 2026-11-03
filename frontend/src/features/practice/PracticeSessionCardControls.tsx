import BookIcon from '@/components/UI/icons/BookIcon';
import HelpText from '@/features/help/HelpText';
import InfoButton from '@/features/notes/InfoButton';
import HelpButton from '@/features/help/HelpButton';
import PlayButton from '@/features/audio/PlayButton';
import VolumeSlider from '@/features/audio/VolumeSlider';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import StyledButton from '@/components/UI/buttons/StyledButton';
import PronunciationIcon from '@/components/UI/icons/PronunciationIcon';
import HintButton from './buttons/HintButton';
import KnownButton from './buttons/KnownButton';
import MasterItemButton from './buttons/MasterItemButton';
import RepeatButton from './buttons/RepeatButton';
import ReviewRatingButton from './buttons/ReviewRatingButton';
import { usePointerReleaseLock } from './hooks/use-pointer-release-lock';
import { TEXTS } from '@/locales/cs';
import type { GrammarChunkWithExamples } from '@/database/state/data-types';
import type { NoteType } from '@/types/generic.types';
import type { PronunciationSegment } from '@/features/pronunciation/pronunciation.utils';
import type {
  NormalizedPracticeSessionCardProps,
  PracticeCardDisplayState,
  PracticeDetail,
} from './practice-session-card.types';
import type { MouseEvent } from 'react';

type PracticeSessionCardControlsProps = Readonly<{
  props: NormalizedPracticeSessionCardProps;
  display: PracticeCardDisplayState;
  setVisibleDetail: (detail: PracticeDetail) => void;
  onDetailLoadError: (detail: PracticeDetail) => void;
  pronunciationSegments: readonly PronunciationSegment[];
  onOpenPronunciation: (segments: readonly PronunciationSegment[]) => void;
}>;

type PracticeControlsProps = Pick<
  NormalizedPracticeSessionCardProps,
  | 'completeCurrent'
  | 'completeDisabled'
  | 'nextKnown'
  | 'nextRepeat'
  | 'nextHard'
  | 'nextGood'
  | 'nextEasy'
  | 'isReviewPractice'
  | 'plusHint'
  | 'repeatDisabled'
  | 'retryAction'
> &
  Readonly<{
    controlsLocked: boolean;
    showHintControl: boolean;
  }>;

// -- Public practice controls --
export default function PracticeSessionCardControls({
  props,
  display,
  setVisibleDetail,
  onDetailLoadError,
  pronunciationSegments,
  onOpenPronunciation,
}: PracticeSessionCardControlsProps) {
  const {
    grammar,
    note,
    ensureDetailLoaded,
    playAudio,
    completeCurrent,
    completeDisabled,
    nextKnown,
    nextRepeat,
    nextHard,
    nextGood,
    nextEasy,
    plusHint,
    isReviewPractice,
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
          nextHard={nextHard}
          nextGood={nextGood}
          nextEasy={nextEasy}
          isReviewPractice={isReviewPractice}
          plusHint={plusHint}
          repeatDisabled={repeatDisabled}
          retryAction={retryAction}
          controlsLocked={display.controlsLocked}
          showHintControl={display.showHintControl}
        />
      </div>
      <div className="pos-bottom-left-control">
        <PlayButton onClick={playAudio} disabled={display.audioButtonDisabled} />
        <SecondaryControlButton
          title={TEXTS.pronunciationGuide}
          aria-label={TEXTS.pronunciationGuide}
          onClick={(event) => {
            event.stopPropagation();
            onOpenPronunciation(pronunciationSegments);
          }}
          disabled={display.pronunciationButtonDisabled}
        >
          <PronunciationIcon />
          <HelpText className="pos-help-below-left flex flex-col items-end landscape:invisible">
            {TEXTS.pronunciationGuide}
          </HelpText>
        </SecondaryControlButton>
        <VolumeSlider />
      </div>
      <div className="pos-bottom-right-control">
        <SecondaryControlButton
          title={TEXTS.grammar}
          aria-label={TEXTS.grammar}
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
          <HelpText className="pos-help-below-left flex flex-col items-end landscape:invisible">
            {TEXTS.tooltipNotes}
          </HelpText>
        </InfoButton>
        <HelpButton />
      </div>
    </>
  );
}

// -- Mode-specific control groups --
function PracticeControls({
  completeCurrent,
  completeDisabled = false,
  nextKnown,
  nextRepeat,
  nextHard,
  nextGood,
  nextEasy,
  isReviewPractice = false,
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

  if (isReviewPractice) {
    return (
      <ReviewPracticeControls
        {...{ nextRepeat, nextHard, nextGood, nextEasy, repeatDisabled, controlsLocked }}
      />
    );
  }

  return (
    <DefaultPracticeControls
      {...{
        completeCurrent,
        completeDisabled,
        nextKnown,
        nextRepeat,
        repeatDisabled,
        controlsLocked,
        lockHintUntilRelease,
      }}
    />
  );
}

function ReviewPracticeControls({
  nextRepeat,
  nextHard,
  nextGood,
  nextEasy,
  repeatDisabled,
  controlsLocked,
}: Pick<
  PracticeControlsProps,
  'nextRepeat' | 'nextHard' | 'nextGood' | 'nextEasy' | 'repeatDisabled' | 'controlsLocked'
>) {
  return (
    <>
      <RepeatButton onClick={() => void nextRepeat()} disabled={repeatDisabled || controlsLocked} />
      <ReviewRatingButton rating="hard" onClick={nextHard} disabled={controlsLocked} />
      <ReviewRatingButton rating="good" onClick={nextGood} disabled={controlsLocked} />
      <ReviewRatingButton rating="easy" onClick={nextEasy} disabled={controlsLocked} />
    </>
  );
}

function DefaultPracticeControls({
  completeCurrent,
  completeDisabled,
  nextKnown,
  nextRepeat,
  repeatDisabled,
  controlsLocked,
  lockHintUntilRelease,
}: Pick<
  PracticeControlsProps,
  'completeCurrent' | 'completeDisabled' | 'nextKnown' | 'nextRepeat' | 'repeatDisabled' | 'controlsLocked'
> & {
  lockHintUntilRelease: () => void;
}) {
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
          void nextKnown?.();
        }}
        disabled={controlsLocked}
      />
    </>
  );
}

// -- Detail-opening actions --
async function openGrammarDetail(
  grammar: GrammarChunkWithExamples | null,
  disabled: boolean,
  ensureDetailLoaded: NormalizedPracticeSessionCardProps['ensureDetailLoaded'],
  onDetailLoadError: (detail: PracticeDetail) => void,
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
  onDetailLoadError('grammar');
}

async function openNoteDetail(
  event: MouseEvent,
  note: NoteType | null,
  disabled: boolean,
  ensureDetailLoaded: NormalizedPracticeSessionCardProps['ensureDetailLoaded'],
  onDetailLoadError: (detail: PracticeDetail) => void,
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
  onDetailLoadError('note');
}
