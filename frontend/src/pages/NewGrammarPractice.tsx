import { DataState } from '@/components/UI/DataState';
import Notification from '@/components/UI/Notification';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useNewGrammarPracticeDeck } from '@/features/practice/hooks/use-new-grammar-practice-deck';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type JSX } from 'react';

export default function NewGrammarPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
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
    return <DataState loading hasData={false} noDataMessage={TEXTS.nothingToPractice} />;
  }

  if (!deck.block) {
    return <PracticeEmptyState />;
  }

  if (showGrammarIntro && deck.grammar != null) {
    return <GrammarDetailCard grammar={deck.grammar} onClose={() => setShowGrammarIntro(false)} />;
  }

  if (deck.isComplete) {
    return (
      <div className="card-width flex flex-col gap-4 text-center">
        <p>{TEXTS.newGrammarComplete}</p>
        <Notification>{deck.block.name}</Notification>
        <ReturnHomeButton />
      </div>
    );
  }

  if (!deck.currentItem) {
    return <PracticeEmptyState />;
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
