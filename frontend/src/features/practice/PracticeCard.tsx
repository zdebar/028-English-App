import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from './hooks/use-practice-deck';
import PracticeSessionCard from './PracticeSessionCard';
import PracticeEmptyState from './PracticeEmptyState';
import { TEXTS } from '@/locales/cs';
import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';
import { useToastStore } from '../toast/use-toast-store';
import { reportError } from '../logging/monitoring-handler';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import type { PracticeDeckEntry } from '@/types/user-item.types';

export default function PracticeCard({ initialDeck }: Readonly<{ initialDeck?: PracticeDeckEntry[] }>) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const {
    currentItem,
    note,
    grammar,
    progress,
    celebratingStar,
    finishedReview,
    isCzToEn,
    revealed,
    handleReveal,
    czech,
    english,
    pronunciation,
    audioDisabled,
    showDirectionChange,
    plusHint,
    nextItem,
    audioError,
    playAudio,
    audioLoading,
    loading,
    error,
  } = usePracticeDeck(userId, initialDeck);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch practice deck', error);
  }, [error, showToast]);

  useEffect(() => {
    if (finishedReview) navigate(ROUTES.home, { replace: true });
  }, [finishedReview, navigate]);

  if (loading && !currentItem) {
    return <DelayedLoadingCircle />;
  }

  if (!currentItem) {
    return <PracticeEmptyState />;
  }

  return (
    <PracticeSessionCard
      note={note}
      grammar={grammar}
      progressLabel={progress}
      celebratingStar={celebratingStar}
      isCzToEn={isCzToEn}
      revealed={revealed}
      czech={czech}
      english={english}
      pronunciation={pronunciation}
      audioDisabled={audioDisabled}
      showDirectionChange={showDirectionChange}
      handleReveal={handleReveal}
      plusHint={plusHint}
      nextRepeat={() => nextItem('incorrect')}
      nextKnown={() => nextItem('correct')}
      completeCurrent={() => nextItem('skip')}
      audioError={audioError}
      playAudio={playAudio}
      audioLoading={audioLoading}
      pronunciationItem={currentItem}
    />
  );
}
