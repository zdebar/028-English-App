import { useCallback, useEffect } from 'react';

import config from '@/config/config';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUserStore } from '../dashboard/use-user-store';
import { usePracticeDeck } from './hooks/use-practice-deck';

import DelayedMessage from '@/components/UI/DelayedMessage';
import Indicator from '@/components/UI/Indicator';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import GrammarCard from '@/features/practice/GrammarCard';
import VolumeSlider from '@/features/practice/VolumeSlider';

import NotificationText from '@/components/UI/NotificationText';
import { TEXTS } from '@/locales/cs';
import GrammarButton from './buttons/GrammarButton';
import HintButton from './buttons/HintButton';
import KnownButton from './buttons/KnownButton';
import MasterItemButton from './buttons/MasterItemButton';
import PlayAudioButton from './buttons/PlayAudioButton';
import UnknownButton from './buttons/UnknownButton';
import { useGrammar } from './hooks/use-grammar';

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard() {
  const userId = useAuthStore((state) => state.userId);
  const userStats = useUserStore((state) => state.userStats);
  const { grammarVisible, grammarData, handleGrammar, closeGrammar } = useGrammar();

  if (!userId)
    return (
      <DelayedMessage>
        <NotificationText text={TEXTS.syncLoadingText} />
      </DelayedMessage>
    );

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

  const practiceCountToday = (userStats?.practiceCountToday ?? 0) + index;

  // Play audio on item change if direction is EN -> CZ
  useEffect(() => {
    if (audioDisabled || isCzToEn || audioLoading || showDirectionChange) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      playAudio();
    }, 400);

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
      <DelayedMessage>
        <NotificationText text="Žádné položky k procvičování" className="color-info" />
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
                <NotificationText
                  text={isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz}
                  className="my-auto"
                />
              ) : (
                <>
                  {!revealed && <HelpText className="center top-4">{TEXTS.reveal}</HelpText>}
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
                      audioLoading && (
                        <DelayedMessage>
                          <NotificationText text={TEXTS.loadingAudio} />
                        </DelayedMessage>
                      )
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
                  onConfirm={() => nextItem(config.progress.skipProgress)}
                  disabled={!revealed || showDirectionChange}
                />
                <PlayAudioButton
                  onClick={handlePlayAudio}
                  disabled={audioDisabled || showDirectionChange}
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
