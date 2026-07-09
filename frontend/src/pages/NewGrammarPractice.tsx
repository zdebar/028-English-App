import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';
import Notification from '@/components/UI/Notification';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import NewGrammarIntroCard from '@/features/practice/NewGrammarIntroCard';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useNewGrammarPracticeDeck } from '@/features/practice/hooks/use-new-grammar-practice-deck';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewGrammarPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [showGrammarIntro, setShowGrammarIntro] = useState(true);
  const deck = useNewGrammarPracticeDeck(userId);

  useEffect(() => {
    if (!deck.error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch new grammar practice deck', deck.error);
  }, [deck.error, showToast]);

  if (!userId) {
    return <Notification>{TEXTS.notAvailable}</Notification>;
  }

  if (deck.loading) {
    return <DelayedLoadingCircle />;
  }

  if (!deck.block) {
    return <PracticeEmptyState />;
  }

  if (deck.isComplete) {
    return (
      <div className="card-width mt-8 flex flex-col gap-4 text-center">
        <p>{TEXTS.newGrammarComplete}</p>
        <Notification>{deck.block.name}</Notification>
        <ReturnHomeButton />
      </div>
    );
  }

  if (!deck.currentItem) {
    return <PracticeEmptyState />;
  }

  if (showGrammarIntro && deck.grammar != null) {
    return (
      <NewGrammarIntroCard
        grammar={deck.grammar}
        onClose={() => navigate(ROUTES.home)}
        onContinue={() => setShowGrammarIntro(false)}
      />
    );
  }

  return (
    <PracticeSessionCard
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
      nextKnown={deck.nextKnown}
      completeCurrent={deck.completeCurrent}
      audioError={deck.audioError}
      playAudio={deck.playAudio}
      audioLoading={deck.audioLoading}
    />
  );
}
