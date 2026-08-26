import Notification from '@/components/UI/Notification';
import { FullStar } from '@/components/UI/StarProgress';
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
import { useState } from 'react';
import type { StarTier } from '@/utils/star-progress.utils';

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
  isBlockTrainingPractice?: boolean;
  isPronunciationPractice?: boolean;
  pronunciationItem?: UserItemLocal | null;
  nextPronunciation?: () => void;
  onPronunciationSelectionChange?: (selected: boolean) => void;
  celebratingStar?: boolean;
  celebrationStarTier?: StarTier;
  onStarCelebrationContinue?: () => void;
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
}: Pick<PracticeSessionCardProps, 'audioError' | 'audioLoading'>) {
  if (audioLoading) {
    return <DelayedNotification message={TEXTS.loadingAudio} />;
  }
  if (audioError) {
    return <p className="font-headings text-lg">{TEXTS.noAudio}</p>;
  }
  return null;
}

function DirectionTopBar({ shortDirectionText }: Readonly<{ shortDirectionText: string }>) {
  return (
    <div className="relative">
      <p className="text-sm font-light">{shortDirectionText}</p>
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
  revealed,
  showDirectionChange,
}: PracticeControlsProps) {
  const { isLocked: isSkipGestureLocked, lockUntilRelease: lockHintUntilRelease } =
    usePointerReleaseLock();

  if (!revealed) {
    return <HintButton onClick={plusHint} disabled={showDirectionChange || isSkipGestureLocked} />;
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
  note,
  grammar,
  progressLabel,
  progressHelpText = TEXTS.progress,
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
  celebratingStar = false,
  celebrationStarTier = 'bronze',
  onStarCelebrationContinue,
}: PracticeSessionCardProps) {
  const userId = useAuthStore((state) => state.userId);
  const [visibleDetail, setVisibleDetail] = useState<VisibleDetail | null>(null);

  const cardText = revealed ? undefined : TEXTS.reveal;
  const cardStyle = revealed ? 'color-audio-disabled' : 'color-button';
  const directionText = isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz;
  const shortDirectionText = isCzToEn ? TEXTS.directionCzToEnShort : TEXTS.directionEnToCzShort;
  const showAudioControls = !audioDisabled;
  const showGrammarButton = Boolean(revealed && (grammar?.note?.trim() || grammar?.items.length));
  const showNoteButton = Boolean(revealed && note?.note.trim());
  const audioControlsDisabled =
    celebratingStar ||
    !showAudioControls ||
    showDirectionChange ||
    audioLoading ||
    (isCzToEn && !revealed);
  const grammarButtonDisabled = celebratingStar || !showGrammarButton || showDirectionChange;
  const noteButtonDisabled = celebratingStar || !showNoteButton || showDirectionChange;
  const practiceControlColumns =
    revealed && !isPronunciationPractice ? 'grid-cols-3' : 'grid-cols-1';
  const showTopBar = !isPronunciationPractice;

  if (visibleDetail) {
    return (
      <PracticeDetail
        visibleDetail={visibleDetail}
        grammar={grammar}
        note={note}
        onClose={() => setVisibleDetail(null)}
      />
    );
  }

  return (
    <div className="bottom-controls-clearance relative flex min-h-0 w-full grow flex-col items-center">
      <div className="card-width card-height relative gap-1" aria-busy={celebratingStar}>
        {celebratingStar && (
          <button
            type="button"
            className="color-button absolute inset-0 z-50 flex items-center justify-center"
            onClick={onStarCelebrationContinue}
            aria-label={TEXTS.continueAfterStar}
            disabled={!onStarCelebrationContinue}
          >
            <span
              className="star-celebration font-headings flex -translate-y-2 flex-col items-center gap-2 text-xl leading-none"
              role="status"
              aria-live="polite"
            >
              <span>{TEXTS.starEarned}</span>
              <FullStar className={`star-fill-${celebrationStarTier}`} size={32} />
              <span>{TEXTS.continueAfterStar}</span>
            </span>
          </button>
        )}
        <button
          type="button"
          className={`relative flex h-full w-full grow cursor-pointer flex-col items-center p-4 text-inherit select-none ${cardStyle}`}
          onClick={handleReveal}
          title={cardText}
          aria-disabled={revealed}
          disabled={celebratingStar}
        >
          {!revealed && !showDirectionChange && (
            <HelpText className="top-23 left-1/2 -translate-x-1/2">{TEXTS.reveal}</HelpText>
          )}
          {showTopBar && (
            <div
              id="top-bar"
              className="relative flex h-8 w-full shrink-0 items-center justify-center text-center"
            >
              <DirectionTopBar shortDirectionText={shortDirectionText} />
            </div>
          )}
          <div
            id="practice-main-content"
            className="flex min-h-0 w-full grow items-center justify-center"
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
            className="relative flex h-8 w-full shrink-0 items-center justify-between"
            id="bottom-bar"
          >
            <p className="min-w-14 px-2 text-right font-light" title={progressHelpText}>
              {progressLabel}
            </p>
            <HelpText className="bottom-7.5">
              {isBlockTrainingPractice ? TEXTS.blockTrainingProgressHelp : progressHelpText}
            </HelpText>
            <div className="flex min-h-0 items-center justify-end px-2 text-right">
              <AudioStatusMessage audioError={audioError} audioLoading={audioLoading} />
            </div>
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
            repeatDisabled={repeatDisabled || celebratingStar}
            revealed={revealed}
            showDirectionChange={showDirectionChange || celebratingStar}
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
              if (!grammar || grammarButtonDisabled) return;
              setVisibleDetail('grammar');
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
              if (!note || noteButtonDisabled) return;
              setVisibleDetail('note');
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
