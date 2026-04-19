import { useCallback, useEffect, useState } from 'react';

import config from '@/config/config';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUserStore } from '../user-stats/use-user-store';
import { usePracticeDeck } from './hooks/use-practice-deck';

import DelayedMessage from '@/components/UI/DelayedMessage';
import Indicator from '@/components/UI/Indicator';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
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
import { useGrammar } from './hooks/use-grammar';
import { useHelpStore } from '../help/use-help-store';

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard() {
  const userId = useAuthStore((state) => state.userId);
  const dailyCount = useUserStore((state) => state.dailyCount);
  const isHelpOpened = useHelpStore((state) => state.isHelpOpened);
  const [counter, setCounter] = useState(0);
  const { grammarVisible, grammarData, handleGrammar, closeGrammar } = useGrammar();

  const practiceCountToday = dailyCount + counter;

  if (!userId)
    return (
      <DelayedMessage>
        <Notification className="color-info pt-4">{TEXTS.syncLoadingText}</Notification>
      </DelayedMessage>
    );

  const {
    currentItem,
    grammar_id,
    progress,
    isCzToEn,
    revealed,
    setRevealed,
    showNewGrammarIndicator,
    czech,
    english,
    pronunciation,
    audioDisabled,
    showDirectionChange,
    hideDirectionChange,
    plusHint,
    nextItem,
    audioError,
    setVolume,
    playAudio,
    audioLoading,
  } = usePracticeDeck(userId);

  // Play audio on item change if direction is EN -> CZ
  useEffect(() => {
    if (audioDisabled || isCzToEn || audioLoading || showDirectionChange) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      playAudio();
    }, config.practice.audioDelay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [audioDisabled, isCzToEn, audioLoading, showDirectionChange, playAudio, currentItem]);

  const handleReveal = useCallback(() => {
    if (showDirectionChange) {
      hideDirectionChange();
      return;
    }

    if (isCzToEn && !audioError && !revealed) {
      playAudio();
    }

    setRevealed(true);
  }, [
    audioError,
    hideDirectionChange,
    isCzToEn,
    playAudio,
    setRevealed,
    showDirectionChange,
    revealed,
  ]);

  const handlePlayAudio = useCallback(() => {
    if (audioDisabled) return;
    playAudio();
  }, [audioDisabled, playAudio]);

  if (!currentItem) {
    return (
      <DelayedMessage timeDelay={300}>
        <Notification className="color-info pt-4">
          <p>{TEXTS.nothingToPractice}</p>
          <p>{TEXTS.tryAgainLater}</p>
        </Notification>
      </DelayedMessage>
    );
  }

  return (
    <div className="relative flex w-full grow flex-col items-center">
      {grammarVisible ? (
        <GrammarCard grammar={grammarData} onClose={closeGrammar} />
      ) : (
        <>
          <div className={`card-width card-height relative gap-1`}>
            {/* Item Card */}
            <div
              className={`relative flex h-full grow cursor-pointer flex-col items-center justify-between p-4 select-none ${
                revealed ? 'color-audio-disabled' : 'color-button'
              } `}
              onClick={handleReveal}
              role="button"
              title={showDirectionChange ? TEXTS.start : !revealed ? TEXTS.reveal : undefined}
              tabIndex={0}
              aria-disabled={revealed}
              onKeyDown={(e) => {
                if (audioDisabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  handleReveal();
                }
                e.preventDefault();
              }}
            >
              {showDirectionChange ? (
                <Notification className="my-auto">
                  {isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz}
                </Notification>
              ) : (
                <>
                  {!revealed && <HelpText className="center top-4">{TEXTS.reveal}</HelpText>}
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
                  {/** Top Bar */}
                  <div
                    id="top-bar"
                    className="relative flex h-8 w-full items-center justify-between"
                  >
                    <VolumeSlider setVolume={setVolume} />
                    {/**Audio messages*/}
                    {audioError ? (
                      <p className="px-2">{TEXTS.noAudio}</p>
                    ) : (
                      audioLoading && (
                        <DelayedMessage>
                          <Notification className="color-info pt-4">
                            {TEXTS.loadingAudio}
                          </Notification>
                        </DelayedMessage>
                      )
                    )}
                  </div>
                  {/** Item Data */}
                  {!isHelpOpened && (
                    <div id="item" className="flex h-full flex-col justify-center gap-1">
                      <p className="text-center font-bold">{czech}</p>
                      <p className="text-center font-normal">{english}</p>
                      <p className="text-center font-normal">{pronunciation}</p>
                    </div>
                  )}

                  {/** Bottom Bar */}
                  <div
                    className="relative flex h-8 w-full items-center justify-between"
                    id="bottom-bar"
                  >
                    <p className="px-2 font-light" title={TEXTS.progress}>
                      {progress}
                    </p>
                    <HelpText className="bottom-7.5">{TEXTS.progress}</HelpText>
                    <p className="px-2 font-light" title={`${TEXTS.today} / ${TEXTS.dailyGoal}`}>
                      {practiceCountToday} / {config.practice.dailyGoal}
                    </p>
                    <HelpText className="right-0 bottom-7.5 flex flex-col items-end">
                      {TEXTS.today} / {TEXTS.dailyGoal}
                    </HelpText>
                  </div>
                </>
              )}
            </div>
            {/* Practice Controls */}
            <div id="practice-controls" className="relative flex flex-col gap-1">
              {/** Top Row */}
              <div className="relative grid grid-cols-2 gap-1">
                <MasterItemButton
                  onConfirm={() => {
                    nextItem(config.progress.skipProgress);
                    setCounter((prev) => prev + 1);
                  }}
                  disabled={!revealed || showDirectionChange}
                />
                <PlayAudioButton
                  onClick={handlePlayAudio}
                  disabled={audioDisabled || showDirectionChange || audioLoading}
                />
              </div>
              {/** Bottom Row */}
              <div className="relative grid grid-cols-2 gap-1">
                {!revealed ? (
                  <>
                    <GrammarButton
                      onClick={() => handleGrammar(grammar_id)}
                      disabled={!grammar_id || showDirectionChange}
                    >
                      {showNewGrammarIndicator && <Indicator className="absolute top-1 right-1" />}
                    </GrammarButton>
                    <HintButton onClick={plusHint} disabled={showDirectionChange} />
                  </>
                ) : (
                  <>
                    <RepeatButton
                      onClick={() => {
                        nextItem(config.progress.minusProgress);
                        setCounter((prev) => prev + 1);
                      }}
                      disabled={showDirectionChange}
                    />
                    <KnownButton
                      onClick={() => {
                        nextItem(config.progress.plusProgress);
                        setCounter((prev) => prev + 1);
                      }}
                      disabled={showDirectionChange}
                    />
                  </>
                )}
              </div>
            </div>

            <HelpButton className="help-btn-pos self-end" />
          </div>
        </>
      )}
    </div>
  );
}
