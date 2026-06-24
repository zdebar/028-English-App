import Notification from '@/components/UI/Notification';
import StyledButton from '@/components/UI/buttons/StyledButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useNewGrammarPracticeDeck } from '@/features/practice/hooks/use-new-grammar-practice-deck';
import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewGrammarPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const [showGrammarIntro, setShowGrammarIntro] = useState(true);
  const deck = useNewGrammarPracticeDeck(userId);

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
    return (
      <div className="card-width flex flex-col gap-4 text-center">
        <p>{TEXTS.newGrammarComplete}</p>
        <Notification>{deck.block.name}</Notification>
        <p className="px-4">{TEXTS.newGrammarFurther}</p>
        <StyledButton className="h-button py-4" onClick={() => navigate(ROUTES.home)}>
          {TEXTS.tooltipHome}
        </StyledButton>
      </div>
    );
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
