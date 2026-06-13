import config from '@/config/config';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUserStore } from '../user-stats/use-user-store';
import { usePracticeDeck } from './hooks/use-practice-deck';

import Indicator from '@/components/UI/Indicator';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import SimpleOverviewCard from './SimpleOverviewCard';
import VolumeSlider from '@/features/audio/VolumeSlider';

import Notification from '@/components/UI/Notification';
import { TEXTS } from '@/locales/cs';
import { TableName } from '@/types/table.types';
import GrammarButton from './buttons/GrammarButton';
import HintButton from './buttons/HintButton';
import KnownButton from './buttons/KnownButton';
import MasterItemButton from './buttons/MasterItemButton';
import PlayAudioButton from './buttons/PlayAudioButton';
import RepeatButton from './buttons/RepeatButton';
import NoteButton from './buttons/NoteButton';
import { useEntityByTable } from './hooks/use-entity-by-table';
import { usePracticeStars } from './hooks/use-practice-stars';
import DelayedNotification from '@/components/UI/DelayedNotification';
import { STAR_SIZE } from '@/components/UI/StarProgress';
import PracticeStarsRow from './components/PracticeStarsRow';

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard() {
  const userId = useAuthStore((state) => state.userId);
  const dailyCount = useUserStore((state) => state.dailyCount);
  const {
    isVisible: isGrammarVisible,
    entityData: grammarData,
    openEntityById: handleGrammar,
    closeEntity: closeGrammar,
  } = useEntityByTable(TableName.Grammar);
  const {
    isVisible: isNoteVisible,
    entityData: noteData,
    openEntityById: handleNote,
    closeEntity: closeNote,
  } = useEntityByTable(TableName.Notes);

  const practiceCountToday = dailyCount;
  const { starChunk, starsPerRow, starCount, displayedChunkCount } =
    usePracticeStars(practiceCountToday);

  const {
    currentItem,
    noteId,
    grammarId,
    progress,
    isCzToEn,
    revealed,
    handleReveal,
    showNewGrammarIndicator,
    czech,
    english,
    pronunciation,
    audioDisabled,
    showDirectionChange,
    plusHint,
    nextItem,
    audioError,
    playAudio,
    audioLoading,
  } = usePracticeDeck(userId);

  const cardText = revealed ? undefined : TEXTS.reveal;
  const cardStyle = revealed ? 'color-audio-disabled' : 'color-button';
  const directionText = isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz;
  const showNoteButton = noteId && revealed;
  let audioStatusMessage = null;

  if (audioLoading) {
    audioStatusMessage = <DelayedNotification message={TEXTS.loadingAudio} timeDelay={500} />;
  } else if (audioError) {
    audioStatusMessage = <p className="px-2">{TEXTS.noAudio}</p>;
  }

  if (!currentItem) {
    return (
      <DelayedNotification timeDelay={300}>
        <p>{TEXTS.nothingToPractice}</p>
        <p>{TEXTS.tryAgainLater}</p>
      </DelayedNotification>
    );
  }

  if (isGrammarVisible) return <SimpleOverviewCard data={grammarData} onClose={closeGrammar} />;
  if (isNoteVisible) return <SimpleOverviewCard data={noteData} onClose={closeNote} />;

  return (
    <div className="help-btn-margin relative flex w-full grow flex-col items-center">
      <div className={`card-width card-height relative gap-1`}>
        {/* Item Card */}
        <div
          className={`relative flex h-full grow cursor-pointer flex-col items-center justify-between p-4 select-none ${cardStyle} `}
          onClick={handleReveal}
          title={cardText}
          role="button"
          tabIndex={0}
          aria-disabled={revealed}
          onKeyDown={(e) => {
            if (audioDisabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleReveal();
            }
          }}
        >
          {!revealed && !showDirectionChange && (
            <HelpText className="center top-4">{TEXTS.reveal}</HelpText>
          )}
          {/** Top Bar */}
          <div id="top-bar" className="relative flex h-8 w-full items-center justify-between">
            <VolumeSlider className="pl-2" />
            {/**Audio messages*/}
            {audioStatusMessage}
          </div>
          {/** Item Data */}
          {showDirectionChange ? (
            <Notification className="my-auto">{directionText}</Notification>
          ) : (
            <div id="item" className="flex h-full flex-col justify-center gap-1">
              <p className="text-center font-bold">{czech}</p>
              <p className="text-center font-normal">{english}</p>
              <p className="text-center font-normal">{pronunciation}</p>
            </div>
          )}

          {/** Bottom Bar */}
          <div className="relative flex h-8 w-full items-center justify-between" id="bottom-bar">
            <p className="px-2 font-light" title={TEXTS.progress}>
              {progress}
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
        </div>
        {/* Practice Controls */}
        <div id="practice-controls" className="relative grid w-full grid-cols-4 gap-1">
          {/** Top Row */}
          <PlayAudioButton
            onClick={playAudio}
            disabled={audioDisabled || showDirectionChange || audioLoading}
          />
          <MasterItemButton
            onConfirm={() => {
              nextItem(config.progress.skipProgress);
            }}
            disabled={!revealed || showDirectionChange}
          />
          {revealed ? (
            <>
              <RepeatButton
                onClick={() => {
                  nextItem(config.progress.minusProgress);
                }}
                disabled={showDirectionChange}
              />
              <KnownButton
                onClick={() => {
                  nextItem(config.progress.plusProgress);
                }}
                disabled={showDirectionChange}
              />
            </>
          ) : (
            <>
              <GrammarButton
                onClick={() => handleGrammar(grammarId)}
                disabled={!grammarId || showDirectionChange}
              >
                {showNewGrammarIndicator && <Indicator className="absolute top-2 right-2" />}
              </GrammarButton>
              <HintButton onClick={plusHint} disabled={showDirectionChange} />
            </>
          )}
        </div>

        <HelpButton className="help-btn-pos self-end" />
        {showNoteButton && (
          <NoteButton
            title={TEXTS.tooltipNotes}
            onClick={(e) => {
              e.stopPropagation();
              handleNote(noteId);
            }}
          />
        )}
      </div>
    </div>
  );
}
