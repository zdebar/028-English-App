import { useCallback, useEffect, useState } from 'react';

import config from '@/config/config';
import Grammar from '@/database/models/grammar';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useAudioManager } from '@/features/practice/use-audio-manager';
import { usePracticeDeck } from '@/features/practice/use-practice-deck';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { useUserStore } from '@/features/dashboard/use-user-store';

import HelpText from '@/features/help/HelpText';
import Indicator from '@/components/UI/Indicator';
import LoadingMessage from '@/components/UI/LoadingMessage';
import HelpButton from '@/features/help/HelpButton';
import GrammarCard, { type GrammarCardType } from '@/features/practice/GrammarCard';
import VolumeSlider from '@/features/practice/VolumeSlider';

import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import BookIcon from '@/components/UI/icons/BookIcon';
import BulbIcon from '@/components/UI/icons/BulbIcon';
import EyeIcon from '@/components/UI/icons/EyeIcon';
import ForwardIcon from '@/components/UI/icons/ForwardIcon';
import MinusIcon from '@/components/UI/icons/MinusIcon';
import PlusIcon from '@/components/UI/icons/PlusIcon';

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard() {
  const [revealed, setRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [showPlayHint, setShowPlayHint] = useState(true);
  const [grammarVisible, setGrammarVisible] = useState(false);
  const [grammarData, setGrammarData] = useState<GrammarCardType | null>(null);
  const { isOpen } = useOverlayStore();
  const { userId } = useAuthStore();
  const { userStats } = useUserStore();
  const { index, array, nextItem, currentItem, direction, grammar_id, loading } = usePracticeDeck(
    userId!,
  );
  const { playAudio, stopAudio, setVolume, audioError, setAudioError } = useAudioManager(
    array || [],
  );

  const isAudioDisabled = (direction && !revealed) || !currentItem?.audio || audioError;

  // Handle advancing to next item
  const handleNext = useCallback(
    async (progressIncrement: number = 0) => {
      setRevealed(false);
      stopAudio();
      nextItem(progressIncrement);
      setHintIndex(0);
    },
    [nextItem, stopAudio],
  );

  // Play audio for the current item
  const playAudioForItem = useCallback(() => {
    if (currentItem?.audio) {
      playAudio(currentItem.audio);
    }
  }, [currentItem, playAudio]);

  // Fetch grammar for the current item and show GrammarCard
  const fetchGrammar = useCallback(async () => {
    if (!currentItem?.grammar_id) return;
    const grammar = await Grammar.getGrammarById(currentItem.grammar_id);
    setGrammarData(grammar);
    setGrammarVisible(true);
  }, [currentItem?.grammar_id]);

  // Auto-play audio on new item if english to czech direction
  useEffect(() => {
    if (!direction && currentItem?.audio && !showPlayHint && !loading) {
      setTimeout(() => playAudio(currentItem.audio!), 500);
    }
  }, [currentItem, direction, playAudio, showPlayHint, loading]);

  // Handle audio errors and retries
  useEffect(() => {
    setAudioError((currentItem && !currentItem?.audio) || audioError);
  }, [audioError, currentItem, setAudioError]);

  if (!array || !currentItem) {
    return <LoadingMessage text="Načítání ..." />;
  }

  return (
    <div className="relative flex w-full grow flex-col items-center">
      {grammarVisible ? (
        <GrammarCard grammar={grammarData} onClose={() => setGrammarVisible(false)} />
      ) : (
        <>
          <div className="card-width card-height relative">
            {/* Item Card */}
            <div
              className={`relative flex h-full grow flex-col items-center justify-between p-4 ${
                isAudioDisabled ? 'color-audio-disabled' : 'color-audio'
              }`}
              onClick={() => {
                if (showPlayHint) {
                  setShowPlayHint(false);
                } else if (!isAudioDisabled) {
                  playAudio(currentItem.audio);
                }
              }}
              aria-label="Přehrát audio"
            >
              {/** Top Bar */}
              <div id="top-bar" className="relative flex h-8 w-full items-center justify-between">
                <VolumeSlider setVolume={setVolume} />
                <p className="error-warning">{audioError && 'bez audia'}</p>
              </div>
              {/** Item Data */}
              <div id="item" className="flex h-full flex-col justify-center gap-1">
                {showPlayHint && !direction && !audioError ? (
                  <div className="error-warning text-center">Stisknutím přehrajte audio</div>
                ) : (
                  <>
                    <p className="text-center font-bold">
                      {direction || revealed
                        ? currentItem?.czech
                        : audioError
                          ? currentItem?.czech
                              ?.slice(0, hintIndex)
                              .padEnd(currentItem?.czech?.length ?? 0, '\u00A0')
                          : hintIndex >= (currentItem?.english?.length ?? 0)
                            ? currentItem?.czech
                                ?.slice(0, hintIndex - (currentItem?.english?.length ?? 0))
                                .padEnd(currentItem?.czech?.length ?? 0, '\u00A0')
                            : '\u00A0'}
                    </p>
                    <p className="text-center">
                      {revealed || (!direction && audioError)
                        ? currentItem?.english
                        : currentItem?.english
                            .slice(0, hintIndex ?? currentItem?.english.length)
                            .padEnd(currentItem?.english.length, '\u00A0')}
                    </p>
                    <p className="text-center">
                      {revealed ? currentItem?.pronunciation || '\u00A0' : '\u00A0'}
                    </p>
                  </>
                )}
              </div>
              {/** Bottom Bar */}
              <div
                className="relative flex h-8 w-full items-center justify-between"
                id="bottom-bar"
              >
                <p className="px-2 font-light">{currentItem?.progress}</p>
                <HelpText visible={isOpen} className="bottom-7.5">
                  pokrok
                </HelpText>
                <p className="px-2 font-light">
                  {(userStats?.practiceCountToday || 0) + index} / {config.practice.dailyGoal}
                </p>
                <HelpText visible={isOpen} className="right-0 bottom-7.5 flex flex-col items-end">
                  <p>dnes / denní cíl</p>
                </HelpText>
              </div>
            </div>
            {/* Practice Controls */}
            <div id="practice-controls" className="relative flex flex-col gap-1">
              {/** Top Row */}
              <div className="relative grid grid-cols-2 gap-1">
                <ButtonRectangular
                  onClick={() => fetchGrammar()}
                  disabled={!grammar_id}
                  className="relative"
                >
                  <BookIcon />
                  {currentItem.is_initial_practice && (
                    <Indicator className="absolute top-1 right-1" />
                  )}
                </ButtonRectangular>
                <HelpText visible={isOpen} className="top-0 left-3.5">
                  gramatika
                </HelpText>
                <ButtonRectangular
                  onClick={() => {
                    handleNext(config.progress.skipProgress);
                  }}
                  disabled={!revealed}
                >
                  <ForwardIcon />
                </ButtonRectangular>
                <HelpText visible={isOpen} className="top-0 right-3.5">
                  dokončit
                </HelpText>
              </div>
              {/** Bottom Row */}
              {!revealed ? (
                /** Not Revealed */
                <div className="relative grid grid-cols-2 gap-1">
                  <ButtonRectangular
                    onClick={() => {
                      setHintIndex((prevIndex) => prevIndex + 1);
                      setShowPlayHint(false);
                    }}
                  >
                    <BulbIcon />
                  </ButtonRectangular>
                  <HelpText visible={isOpen} className="top-0 left-3.5">
                    nápověda
                  </HelpText>
                  <ButtonRectangular
                    onClick={() => {
                      if (showPlayHint) {
                        setShowPlayHint(false);
                      }
                      setRevealed(true);
                      if (direction) {
                        playAudioForItem();
                      }
                      setHintIndex(() => 0);
                    }}
                  >
                    <EyeIcon />
                  </ButtonRectangular>
                  <HelpText visible={isOpen} className="top-0 right-3.5">
                    odhalit
                  </HelpText>
                </div>
              ) : (
                /** Revealed */
                <div className="relative grid grid-cols-2 gap-1">
                  <ButtonRectangular onClick={() => handleNext(config.progress.minusProgress)}>
                    <MinusIcon />
                  </ButtonRectangular>
                  <HelpText visible={isOpen} className="top-0 left-3.5">
                    neznám
                  </HelpText>
                  <ButtonRectangular onClick={() => handleNext(config.progress.plusProgress)}>
                    <PlusIcon />
                  </ButtonRectangular>
                  <HelpText visible={isOpen} className="top-0 right-3.5">
                    znám
                  </HelpText>
                </div>
              )}
            </div>
            <HelpButton className="help-btn-pos self-end" />
          </div>
        </>
      )}
    </div>
  );
}
