import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { usePronunciationPracticeDeck } from '@/features/pronunciation/use-pronunciation-practice-deck';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect } from 'react';

export default function PronunciationPractice() {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const deck = usePronunciationPracticeDeck(userId);

  useEffect(() => {
    if (!deck.error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch pronunciation practice deck', deck.error);
  }, [deck.error, showToast]);

  if (deck.loading) return <DelayedLoadingCircle />;
  if (deck.isComplete) {
    return (
      <div className="card-width mt-8 flex flex-col gap-4 text-center">
        <p>{TEXTS.pronunciationPracticeComplete}</p>
        <ReturnHomeButton />
      </div>
    );
  }
  if (!deck.currentItem) return <PracticeEmptyState />;

  return (
    <PracticeSessionCard
      noteId={deck.currentItem.note_id}
      grammarChunkId={deck.currentItem.grammar_chunk_id}
      progressLabel={deck.progressLabel}
      isCzToEn={false}
      revealed={deck.revealed}
      czech={deck.czech}
      english={deck.english}
      pronunciation={deck.pronunciation}
      audioDisabled={deck.audioDisabled}
      showDirectionChange={deck.showDirectionChange}
      handleReveal={deck.handleReveal}
      plusHint={deck.plusHint}
      nextRepeat={deck.next}
      nextKnown={deck.next}
      audioError={deck.audioError}
      playAudio={deck.playAudio}
      audioLoading={deck.audioLoading}
      isPronunciationPractice
      pronunciationItem={deck.currentItem}
      nextPronunciation={deck.next}
    />
  );
}
