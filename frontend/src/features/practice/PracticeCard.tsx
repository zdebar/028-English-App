import { useState } from 'react';

import config from '@/config/config';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUserStore } from '../user-stats/use-user-store';
import { usePracticeDeck } from './hooks/use-practice-deck';

import Indicator from '@/components/UI/Indicator';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import OverviewCard from '@/components/UI/OverviewCard';
import GrammarCard from '@/features/practice/GrammarCard';
import VolumeSlider from '@/features/practice/VolumeSlider';

import Notification from '@/components/UI/Notification';
import { TEXTS } from '@/locales/cs';
import GrammarButton from './buttons/GrammarButton';
import HintButton from './buttons/HintButton';
import KnownButton from './buttons/KnownButton';
import MasterItemButton from './buttons/MasterItemButton';
import PlayAudioButton from './buttons/PlayAudioButton';
import RepeatButton from './buttons/RepeatButton';
import NoteButton from './buttons/NoteButton';
import { useGrammar } from './hooks/use-grammar';
import { usePracticeStarProgress } from './hooks/use-practice-star-progress';
import { useHelpStore } from '../help/use-help-store';
import DelayedNotification from '@/components/UI/DelayedNotification';
import { CompactSummary, Star, STAR_SIZE } from '@/components/UI/StarProgress';

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard() {
  const userId = useAuthStore((state) => state.userId);
  const dailyCount = useUserStore((state) => state.dailyCount);
  const isHelpOpened = useHelpStore((state) => state.isHelpOpened);
  const { grammarVisible, grammarData, handleGrammar, closeGrammar } = useGrammar();

  const practiceCountToday = dailyCount;
  const {
    starChunk,
    starsPerRow,
    starProgress,
    displayedChunkCount,
    displayedStarProgress,
    completedStarFlash,
  } = usePracticeStarProgress(practiceCountToday);

  const {
    currentItem,
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
    setVolume,
    playAudio,
    audioLoading,
  } = usePracticeDeck(userId);
  const [showNote, setShowNote] = useState(false);

  const cardText = revealed ? undefined : TEXTS.reveal;
  const cardStyle = revealed ? 'color-audio-disabled' : 'color-button';
  const directionText = isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz;
  const showNoteButton = !!currentItem?.note && currentItem.note.length > 0 && revealed;

  if (!currentItem) {
    return (
      <DelayedNotification timeDelay={300}>
        <p>{TEXTS.nothingToPractice}</p>
        <p>{TEXTS.tryAgainLater}</p>
      </DelayedNotification>
    );
  }

  if (grammarVisible) return <GrammarCard grammar={grammarData} onClose={closeGrammar} />;

  if (showNote)
    return (
      <OverviewCard onClose={() => setShowNote(false)} buttonTitle={currentItem?.english}>
        <div
          dangerouslySetInnerHTML={{ __html: currentItem?.note || '' }}
          className="grammar p-4"
        />
      </OverviewCard>
    );

  return (
    <div className="relative flex w-full grow flex-col items-center">
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
          {!showDirectionChange && (
            <>
              <HelpText className="top-20 left-4">
                <span className="help-text-span">{TEXTS.shortCut}</span>
                {TEXTS.short}
              </HelpText>
              <HelpText className="top-28 left-4">
                <span className="help-text-span">{TEXTS.singularCut}</span>
                {TEXTS.singular}
              </HelpText>
              <HelpText className="top-36 left-4">
                <span className="help-text-span">{TEXTS.pluralCut}</span>
                {TEXTS.plural}
              </HelpText>
            </>
          )}
          {/** Top Bar */}
          <div id="top-bar" className="relative flex h-8 w-full items-center justify-between">
            <VolumeSlider setVolume={setVolume} />
            {/**Audio messages*/}
            {audioError ? (
              <p className="px-2">{TEXTS.noAudio}</p>
            ) : (
              audioLoading && <DelayedNotification message={TEXTS.loadingAudio} timeDelay={500} />
            )}
          </div>
          {/** Item Data */}
          {showDirectionChange ? (
            <Notification className="my-auto">{directionText}</Notification>
          ) : (
            !isHelpOpened && (
              <div id="item" className="flex h-full flex-col justify-center gap-1">
                <p className="text-center font-bold">{czech}</p>
                <p className="text-center font-normal">{english}</p>
                <p className="text-center font-normal">{pronunciation}</p>
              </div>
            )
          )}

          {/** Bottom Bar */}
          <div className="relative flex h-8 w-full items-center justify-between" id="bottom-bar">
            <p className="px-2 font-light" title={TEXTS.progress}>
              {progress}
            </p>
            <HelpText className="bottom-7.5">{TEXTS.progress}</HelpText>
            <div
              className="relative isolate flex items-center gap-2 overflow-visible px-2 font-light"
              title={TEXTS.nextStarProgress}
            >
              <CompactSummary
                fullTierCount={starProgress.completedTiers}
                partialTierCount={starProgress.activeRowCompletedStars}
                partialTier={starProgress.activeTier}
                starsPerRow={starsPerRow}
                size={STAR_SIZE}
              />
              <span className="relative z-0 inline-flex items-center gap-2 self-center whitespace-nowrap">
                <Star
                  progress={displayedStarProgress}
                  tier={starProgress.activeTier}
                  label={TEXTS.currentPracticeStar}
                  size={STAR_SIZE}
                  className="self-center"
                />
                <span
                  className={`inline-block w-18 text-right tabular-nums transition-colors duration-200 ${
                    completedStarFlash === 'bronze'
                      ? 'font-bold text-[#B87333] dark:text-[#D8A373]'
                      : completedStarFlash === 'silver'
                        ? 'font-bold text-[#A8ADB7] dark:text-[#E5E7EB]'
                        : completedStarFlash === 'gold'
                          ? 'font-bold text-[#D4AF37] dark:text-[#FFD36B]'
                          : ''
                  }`}
                >
                  {displayedChunkCount} / {starChunk}
                </span>
              </span>
            </div>
            <HelpText className="right-0 bottom-7.5 flex flex-col items-end">
              {TEXTS.nextStarProgress}
            </HelpText>
          </div>
        </div>
        {/* Practice Controls */}
        <div id="practice-controls" className="relative flex flex-col gap-1">
          {/** Top Row */}
          <div className="relative grid grid-cols-2 gap-1">
            <MasterItemButton
              onConfirm={() => {
                nextItem(config.progress.skipProgress);
              }}
              disabled={!revealed || showDirectionChange}
            />
            <PlayAudioButton
              onClick={playAudio}
              disabled={audioDisabled || showDirectionChange || audioLoading}
            />
          </div>
          {/** Bottom Row */}
          <div className="relative grid grid-cols-2 gap-1">
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
        </div>

        <HelpButton className="help-btn-pos self-end" />
        {showNoteButton && (
          <NoteButton
            title={TEXTS.tooltipNotes}
            onClick={(e) => {
              e.stopPropagation();
              setShowNote(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
