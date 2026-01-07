import { useState, useEffect, useCallback } from 'react';
import VolumeSlider from '@/features/practice/VolumeSlider';
import Button from '@/components/UI/buttons/Button';
import ForwardIcon from '@/components/UI/icons/ForwardIcon';
import BulbIcon from '@/components/UI/icons/BulbIcon';
import EyeIcon from '@/components/UI/icons/EyeIcon';
import MinusIcon from '@/components/UI/icons/MinusIcon';
import PlusIcon from '@/components/UI/icons/PlusIcon';
import BookIcon from '@/components/UI/icons/BookIcon';
import config from '@/config/config';
import { usePracticeDeck } from '@/features/practice/use-practice-deck';
import { useAudioManager } from '@/features/practice/use-audio-manager';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUserStore } from '@/hooks/use-user-store';
import GrammarCard, { type GrammarCardType } from '@/features/practice/GrammarCard';
import Loading from '@/components/UI/Loading';
import HelpButton from '@/features/overlay/HelpButton';
import Hint from '@/components/UI/Hint';
import { useOverlayStore } from '@/hooks/use-overlay-store';
import Grammar from '@/database/models/grammar';

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
    return <Loading text="Načítání ..." />;
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
              <div id="top-bar" className="relative flex w-full items-center justify-between">
                <VolumeSlider setVolume={setVolume} />
                <p className="text-notice">{audioError && 'bez audia'}</p>
              </div>
              <div id="item" className="flex h-full flex-col justify-center gap-1">
                {showPlayHint && !direction && !audioError ? (
                  <div className="text-notice text-center">Stisknutím přehrajte audio</div>
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
              <div className="relative flex w-full items-center justify-between" id="bottom-bar">
                <p className="px-2 font-light">{currentItem?.progress}</p>
                <Hint visibility={isOpen} style={{ bottom: '30px' }}>
                  pokrok
                </Hint>
                <p className="px-2 font-light">
                  {(userStats?.practiceCountToday || 0) + index} / {config.practice.dailyGoal}
                </p>
                <Hint
                  visibility={isOpen}
                  style={{ bottom: '30px', right: '0' }}
                  className="flex flex-col items-end"
                >
                  <p>počet procvičení</p>
                  <p>/ denní cíl</p>
                </Hint>
              </div>
            </div>
            {/* Practice Controls */}
            <div id="practice-controls" className="relative flex flex-col gap-1">
              <div className="flex gap-1">
                <Button onClick={() => fetchGrammar()} disabled={!grammar_id}>
                  <BookIcon />
                </Button>
                <Hint visibility={isOpen} style={{ top: '0px', left: '14px' }}>
                  gramatika
                </Hint>
                <Button
                  onClick={() => {
                    handleNext(config.progress.skipProgress);
                  }}
                  disabled={!revealed}
                >
                  <ForwardIcon />
                </Button>
                <Hint visibility={isOpen} style={{ top: '0px', right: '14px' }}>
                  dokončit
                </Hint>
              </div>
              {!revealed ? (
                <div className="relative flex gap-1">
                  <Button
                    onClick={() => {
                      setHintIndex((prevIndex) => prevIndex + 1);
                      setShowPlayHint(false);
                    }}
                  >
                    <BulbIcon />
                  </Button>
                  <Hint visibility={isOpen} style={{ top: '0px', left: '14px' }}>
                    nápověda
                  </Hint>
                  <Button
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
                  </Button>
                  <Hint visibility={isOpen} style={{ top: '0px', right: '14px' }}>
                    odhalit
                  </Hint>
                </div>
              ) : (
                <div className="relative flex gap-1">
                  <Button onClick={() => handleNext(config.progress.minusProgress)}>
                    <MinusIcon />
                  </Button>
                  <Hint visibility={isOpen} style={{ top: '0px', left: '14px' }}>
                    neznám
                  </Hint>
                  <Button onClick={() => handleNext(config.progress.plusProgress)}>
                    <PlusIcon />
                  </Button>
                  <Hint visibility={isOpen} style={{ top: '0px', right: '14px' }}>
                    znám
                  </Hint>
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
