import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { usePronunciationPracticeDeck } from '@/features/pronunciation/use-pronunciation-practice-deck';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';

const doNothing = () => undefined;

export default function PronunciationPractice() {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const initialDeck = useLoaderData() as Array<ResolvedPracticeEntry<UserItemLocal>>;
  const deck = usePronunciationPracticeDeck(userId, initialDeck);

  useEffect(() => {
    if (!deck.error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch pronunciation practice deck', deck.error);
  }, [deck.error, showToast]);

  if (deck.loading) return <DelayedLoadingCircle />;
  if (!deck.currentItem) return <PracticeEmptyState showTryAgainLater={false} />;

  return (
    <PracticeSessionCard
      note={deck.note}
      grammar={deck.grammar}
      progressLabel={deck.progressLabel}
      isCzToEn={false}
      revealed
      czech={deck.czech}
      english={deck.english}
      pronunciation={deck.pronunciation}
      audioDisabled={deck.audioDisabled}
      showDirectionChange={false}
      handleReveal={doNothing}
      plusHint={doNothing}
      nextRepeat={deck.next}
      nextKnown={deck.next}
      audioError={deck.audioError}
      playAudio={deck.playAudio}
      audioLoading={deck.audioLoading}
      isPronunciationPractice
      pronunciationItem={deck.currentItem}
      nextPronunciation={deck.canGoNext ? deck.next : undefined}
      onPronunciationSelectionChange={deck.handleSelectionChange}
    />
  );
}
