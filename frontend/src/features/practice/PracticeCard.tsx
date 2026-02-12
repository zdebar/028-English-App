import { useCallback, useState } from 'react';

import config from '@/config/config';
import Grammar from '@/database/models/grammar';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from '@/features/practice/use-practice-deck';
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
import { errorHandler } from '../logging/error-handler';
import { useToastStore } from '../toast/use-toast-store';
import { TEXTS } from '@/locales/cs';

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard() {
  const [grammarVisible, setGrammarVisible] = useState(false);
  const [grammarData, setGrammarData] = useState<GrammarCardType | null>(null);

  const userId = useAuthStore((state) => state.userId);
  const userStats = useUserStore((state) => state.userStats);
  const showToast = useToastStore((state) => state.showToast);
  const {
    index,
    currentItem,
    grammar_id,
    progress,
    direction,
    revealed,
    setRevealed,
    showNewGrammarIndicator,
    czech,
    english,
    pronunciation,
    audioDisabled,
    plusHint,
    nextItem,
    audioError,
    setVolume,
    playAudio,
  } = usePracticeDeck(userId!);

  // Fetch grammar for the current item and show GrammarCard
  const fetchGrammar = useCallback(async () => {
    if (!grammar_id) return;
    try {
      const grammar = await Grammar.getGrammarById(grammar_id);
      setGrammarData(grammar);
      setGrammarVisible(true);
    } catch (error) {
      errorHandler('Error fetching grammar:', error);
      showToast(TEXTS.loadingError, 'error');
    }
  }, [grammar_id, showToast]);

  if (!currentItem) {
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
                audioDisabled ? 'color-audio-disabled' : 'color-audio'
              }`}
              onClick={() => {
                if (!audioDisabled) {
                  playAudio();
                }
              }}
            >
              {/** Top Bar */}
              <div id="top-bar" className="relative flex h-8 w-full items-center justify-between">
                <VolumeSlider setVolume={setVolume} />
                <p className="error-warning">{audioError && TEXTS.noAudio}</p>
              </div>
              {/** Item Data */}
              <div id="item" className="flex h-full flex-col justify-center gap-1">
                <p className="text-center font-bold">{czech}</p>
                <p className="text-center">{english}</p>
                <p className="text-center">{pronunciation}</p>
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
                  {showNewGrammarIndicator && <Indicator className="absolute top-1 right-1" />}
                </ButtonRectangular>
                <HelpText className="top-0 left-3.5">{TEXTS.grammar}</HelpText>
                <ButtonRectangular
                  onClick={() => {
                    nextItem(config.progress.skipProgress);
                  }}
                  disabled={!revealed}
                >
                  <ForwardIcon />
                </ButtonRectangular>
                <HelpText className="top-0 right-3.5">{TEXTS.complete}</HelpText>
              </div>
              {/** Bottom Row */}
              {!revealed ? (
                /** Not Revealed */
                <div className="relative grid grid-cols-2 gap-1">
                  <ButtonRectangular onClick={plusHint}>
                    <BulbIcon />
                  </ButtonRectangular>
                  <HelpText className="top-0 left-3.5">{TEXTS.hint}</HelpText>
                  <ButtonRectangular
                    onClick={() => {
                      if (direction) {
                        playAudio();
                      }
                      setRevealed(true);
                    }}
                  >
                    <EyeIcon />
                  </ButtonRectangular>
                  <HelpText className="top-0 right-3.5">{TEXTS.reveal}</HelpText>
                </div>
              ) : (
                /** Revealed */
                <div className="relative grid grid-cols-2 gap-1">
                  <ButtonRectangular onClick={() => nextItem(config.progress.minusProgress)}>
                    <MinusIcon />
                  </ButtonRectangular>
                  <HelpText className="top-0 left-3.5">{TEXTS.unknown}</HelpText>
                  <ButtonRectangular onClick={() => nextItem(config.progress.plusProgress)}>
                    <PlusIcon />
                  </ButtonRectangular>
                  <HelpText className="top-0 right-3.5">{TEXTS.known}</HelpText>
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
