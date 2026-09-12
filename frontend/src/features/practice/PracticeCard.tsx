import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from './hooks/use-practice-deck';
import PracticeSessionCard from './PracticeSessionCard';
import PracticeEmptyState from './PracticeEmptyState';
import PracticeEndState from './PracticeEndState';
import { TEXTS } from '@/locales/cs';
import DelayedMessage from '@/components/UI/DelayedMessage';
import { useToastStore } from '../toast/use-toast-store';
import { reportError } from '../logging/monitoring-handler';
import { useEffect } from 'react';
import type { ReviewDeckData } from '@/database/utils/practice-content.utils';

export default function PracticeCard({
  initialReviewData,
}: Readonly<{ initialReviewData?: ReviewDeckData }>) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const {
    currentItem,
    note,
    grammar,
    progressLabel,
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
  } = usePracticeDeck(userId, initialReviewData);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch practice deck', error);
  }, [error, showToast]);

  if (loading && !currentItem) {
    return <DelayedMessage />;
  }

  if (finishedReview) {
    return <PracticeEndState message={TEXTS.reviewCompleted} />;
  }

  if (!currentItem) {
    return <PracticeEmptyState />;
  }

  return (
    <PracticeSessionCard
      note={note}
      grammar={grammar}
      progressLabel={progressLabel}
      progressHelpText={TEXTS.reviewProgress}
      showProgressLabel
      isBlockTrainingPractice={false}
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
      isContentLoading={loading}
    />
  );
}
