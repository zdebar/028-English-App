import { useEffect } from 'react';

import config from '@/config/config';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from './hooks/use-practice-deck';
import { useUserStore } from '../dashboard/use-user-store';

import HelpText from '@/features/help/HelpText';
import Indicator from '@/components/UI/Indicator';
import DelayedMessage from '@/components/UI/DelayedMessage';
import HelpButton from '@/features/help/HelpButton';
import GrammarCard from '@/features/practice/GrammarCard';
import VolumeSlider from '@/features/practice/VolumeSlider';

import HintButton from './buttons/HintButton';
import GrammarButton from './buttons/GrammarButton';
import { TEXTS } from '@/locales/cs';
import NotRevealedIcon from '@/components/UI/icons/NotRevealedIcon';
import { useGrammar } from './hooks/use-grammar';
import KnownButton from './buttons/KnownButton';
import UnknownButton from './buttons/UnknownButton';
import SkipButton from './buttons/SkipButton';
import PlayAudioButton from './buttons/PlayAudioButton';

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard() {
  const userId = useAuthStore((state) => state.userId);
  const userStats = useUserStore((state) => state.userStats);
  const { grammarVisible, grammarData, handleGrammar, closeGrammar } = useGrammar();

  if (!userId) return <DelayedMessage text={TEXTS.syncLoadingText} />;

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
    return <DelayedMessage text="Žádné položky k procvičování" timeDelay={100} />;
  }

  const handleReveal = () => {
    if (showDirectionChange) {
      hideDirectionChange();
      return;
    }
    if (isCzToEn && !audioError) {
      playAudio();
    }
    setRevealed(true);
  };

  return (
    <div className="relative flex w-full grow flex-col items-center">
      {grammarVisible ? (
        <GrammarCard grammar={grammarData} onClose={closeGrammar} />
      ) : (
        <>
          <div className={`card-width card-height relative gap-1`}>
            {/* Item Card */}
            <div
              className={`relative flex h-full grow flex-col items-center justify-between p-4 select-none ${
                revealed ? 'color-audio-disabled' : 'button-color'
              } `}
              onClick={handleReveal}
              role="button"
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
                <p className="error-warning my-auto">
                  {isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz}
                </p>
              ) : (
                <>
                  {!revealed && (
                    <>
                      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                        <NotRevealedIcon className="text-light/70 dark:text-dark/70 opacity-5 mix-blend-saturation dark:opacity-2" />
                      </div>
                      <HelpText className="center top-4">{TEXTS.reveal}</HelpText>
                    </>
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
                      audioLoading && <DelayedMessage text={TEXTS.loadingAudio} />
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
                <PlayAudioButton
                  onClick={() => {
                    if (!audioDisabled) {
                      playAudio();
                    }
                  }}
                  disabled={audioDisabled || showDirectionChange}
                />
              </div>
              {/** Bottom Row */}
              <div className={`} relative grid grid-cols-2 gap-1`}>
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
                    <UnknownButton
                      onClick={() => nextItem(config.progress.minusProgress)}
                      disabled={showDirectionChange}
                    />
                    <KnownButton
                      onClick={() => nextItem(config.progress.plusProgress)}
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
