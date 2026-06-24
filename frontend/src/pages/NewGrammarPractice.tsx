import Notification from '@/components/UI/Notification';
import { useAuthStore } from '@/features/auth/use-auth-store';
import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useNewGrammarPracticeDeck } from '@/features/practice/hooks/use-new-grammar-practice-deck';
import { ROUTES } from '@/config/routes.config';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, useRef, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewGrammarPractice(): JSX.Element | null {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [showGrammarIntro, setShowGrammarIntro] = useState(true);
  const deck = useNewGrammarPracticeDeck(userId);
  const hasHandledCompletion = useRef(false);

  useEffect(() => {
    if (!deck.isComplete || hasHandledCompletion.current) {
      return;
    }

    hasHandledCompletion.current = true;
    showToast(TEXTS.newGrammarComplete, 'success');
    navigate(ROUTES.home, { replace: true });
  }, [deck.isComplete, navigate, showToast]);

  if (!userId) {
    return <Notification>{TEXTS.notAvailable}</Notification>;
  }

  if (!deck.block) {
    return <Notification>{TEXTS.nothingToPractice}</Notification>;
  }

  if (showGrammarIntro && deck.grammar != null) {
    return <GrammarDetailCard grammar={deck.grammar} onClose={() => setShowGrammarIntro(false)} />;
  }

  if (deck.isComplete) {
    return null;
  }

  if (!deck.currentItem) {
    return <Notification>{TEXTS.nothingToPractice}</Notification>;
  }

  return (
    <PracticeSessionCard
      currentItem={deck.currentItem}
      noteId={deck.noteId}
      grammarId={deck.grammarId}
      progressLabel={deck.progressLabel}
      isCzToEn={deck.isCzToEn}
      revealed={deck.revealed}
      showNewGrammarIndicator={deck.showNewGrammarIndicator}
      czech={deck.czech}
      english={deck.english}
      pronunciation={deck.pronunciation}
      audioDisabled={deck.audioDisabled}
      showDirectionChange={deck.showDirectionChange}
      handleReveal={deck.handleReveal}
      plusHint={deck.plusHint}
      nextRepeat={deck.nextRepeat}
      repeatDisabled={deck.repeatDisabled}
      nextKnown={deck.nextKnown}
      completeDisabled
      audioError={deck.audioError}
      playAudio={deck.playAudio}
      audioLoading={deck.audioLoading}
    />
  );
}
