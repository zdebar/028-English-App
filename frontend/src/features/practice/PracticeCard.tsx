import { useEffect } from 'react';

import config from '@/config/config';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from '@/features/practice/use-practice-deck';
import { useUserStore } from '../dashboard/use-user-store';

import HelpText from '@/features/help/HelpText';
import Indicator from '@/components/UI/Indicator';
import LoadingMessage from '@/components/UI/LoadingMessage';
import HelpButton from '@/features/help/HelpButton';
import GrammarCard from '@/features/practice/GrammarCard';
import VolumeSlider from '@/features/practice/VolumeSlider';

import HintButton from './HintButton';
import GrammarButton from './GrammarButton';
import { TEXTS } from '@/locales/cs';
import NotRevealedIcon from '@/components/UI/icons/NotRevealedIcon';
import { useGrammar } from './use-grammar';
import KnownButton from './KnownButton';
import UnknownButton from './UnknownButton';
import RevealButton from './RevealButton';
import SkipButton from './SkipButton';

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard() {
  const userId = useAuthStore((state) => state.userId);
  const userStats = useUserStore((state) => state.userStats);
  const { grammarVisible, grammarData, handleGrammar, closeGrammar } = useGrammar();

  if (!userId) return <LoadingMessage text={TEXTS.syncLoadingText} />;

  const {
    index,
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
    if (!audioDisabled && !isCzToEn && !audioLoading && !showDirectionChange) {
      setTimeout(() => playAudio(), 400);
    }
  }, [playAudio, audioDisabled, isCzToEn, audioLoading, showDirectionChange, currentItem]);

  if (!currentItem) {
    return <LoadingMessage text="Žádné položky k procvičování" timeDelay={100} />;
  }

  return (
    <div className="relative flex w-full grow flex-col items-center">
      {grammarVisible ? (
        <GrammarCard grammar={grammarData} onClose={closeGrammar} />
      ) : (
        <>
          <div className={`card-width card-height relative`}>
            {/* Item Card */}
            <div
              className={`relative flex h-full grow flex-col items-center p-4 select-none ${
                audioDisabled && !showDirectionChange ? 'color-audio-disabled' : 'button-color'
              } ${showDirectionChange ? 'justify-center' : 'justify-between'} `}
              onClick={() => {
                if (showDirectionChange) {
                  hideDirectionChange();
                  return;
                }
                if (!audioDisabled) {
                  playAudio();
                }
              }}
              role="button"
              tabIndex={0}
              aria-disabled={audioDisabled}
              onKeyDown={(e) => {
                if (audioDisabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  if (!showDirectionChange) {
                    playAudio();
                  }
                  e.preventDefault();
                }
              }}
            >
              {showDirectionChange ? (
                <div>
                  <p className="error-warning my-auto">
                    {isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz}
                  </p>
                  <p className="error-warning my-auto">{TEXTS.pressButton}</p>
                </div>
              ) : (
                <>
                  {!revealed && (
                    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                      <NotRevealedIcon className="text-light/70 dark:text-dark/70 opacity-5 mix-blend-saturation dark:opacity-2" />
                    </div>
                  )}
                  {/** Top Bar */}
                  <div
                    id="top-bar"
                    className="relative flex h-8 w-full items-center justify-between"
                  >
                    <VolumeSlider
                      setVolume={setVolume}
                      className={`${audioDisabled && 'invisible'}`}
                    />
                    {/**Audio messages*/}
                    {audioError ? (
                      <p className="px-2">{TEXTS.noAudio}</p>
                    ) : (
                      audioLoading && <LoadingMessage text={TEXTS.loadingAudio} />
                    )}
                  </div>
                  {/** Item Data */}
                  <div id="item" className="flex h-full flex-col justify-center gap-1">
                    <p className="text-center font-bold">{czech}</p>
                    <p className="text-center font-normal">{english}</p>
                    <p className="text-center font-normal">{pronunciation}</p>
                  </div>

                  {/** Bottom Bar */}
                  <div
                    className="relative flex h-8 w-full items-center justify-between"
                    id="bottom-bar"
                  >
                    <p className="px-2 font-light">{progress}</p>
                    <HelpText className="bottom-7.5">{TEXTS.progress}</HelpText>
                    <p className="px-2 font-light">
                      {(userStats?.practiceCountToday || 0) + index} / {config.practice.dailyGoal}
                    </p>
                    <HelpText className="right-0 bottom-7.5 flex flex-col items-end">
                      <p>
                        {TEXTS.today} / {TEXTS.dailyGoal}
                      </p>
                    </HelpText>
                  </div>
                </>
              )}
            </div>
            {/* Practice Controls */}
            <div id="practice-controls" className="relative flex flex-col gap-1">
              {/** Top Row */}
              <div className="relative grid grid-cols-2 gap-1">
                <SkipButton
                  onConfirm={() => nextItem(config.progress.skipProgress)}
                  disabled={!revealed || showDirectionChange}
                />
                {!revealed ? (
                  <HintButton onClick={plusHint} disabled={showDirectionChange} />
                ) : (
                  <KnownButton
                    onClick={() => nextItem(config.progress.plusProgress)}
                    disabled={showDirectionChange}
                  />
                )}
              </div>
              {/** Bottom Row */}
              <div className="relative grid grid-cols-2 gap-1">
                <GrammarButton
                  onClick={() => handleGrammar(grammar_id)}
                  disabled={!grammar_id || showDirectionChange}
                >
                  {showNewGrammarIndicator && <Indicator className="absolute top-1 right-1" />}
                </GrammarButton>
                {!revealed ? (
                  <RevealButton
                    onClick={() => {
                      if (isCzToEn && !audioError) {
                        playAudio();
                      }
                      setRevealed(true);
                    }}
                    disabled={showDirectionChange}
                  />
                ) : (
                  <UnknownButton
                    onClick={() => nextItem(config.progress.minusProgress)}
                    disabled={showDirectionChange}
                  />
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
