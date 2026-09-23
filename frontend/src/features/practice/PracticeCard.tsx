import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from './hooks/use-practice-deck';
import PracticeSessionCard, { type PracticeDetail } from './PracticeSessionCard';
import PracticeEmptyState from './PracticeEmptyState';
import PracticeEndState from './PracticeEndState';
import { TEXTS } from '@/locales/cs';
import DelayedMessage from '@/components/UI/DelayedMessage';
import { useToastStore } from '../toast/use-toast-store';
import { reportError } from '../logging/monitoring-handler';
import { useCallback, useEffect, useRef } from 'react';
import type { ReviewDeckData } from '@/database/utils/practice-content.utils';
import { usePracticeExitBlocker } from './hooks/use-practice-exit-blocker';

type PracticeCardProps = Readonly<{
  initialData?: ReviewDeckData;
}>;

export default function PracticeCard({ initialData }: PracticeCardProps) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const notifiedDetailFailuresRef = useRef(new Set<string>());
  const {
    currentItem,
    note,
    grammar,
    noteAvailable,
    grammarAvailable,
    noteLoadFailed,
    grammarLoadFailed,
    ensureDetailLoaded,
    progressLabel,
    finishedReview,
    revealed,
    handleReveal,
    czech,
    english,
    pronunciation,
    audioDisabled,
    plusHint,
    nextItem,
    audioError,
    playAudio,
    audioLoading,
    loading,
    error,
    finishPractice,
  } = usePracticeDeck(userId, initialData);

  usePracticeExitBlocker(finishPractice);

  const notifyDetailLoadFailure = useCallback(
    (detail: PracticeDetail): void => {
      if (!currentItem) return;
      const failureKey = `${currentItem.item_id}:${detail}`;
      if (notifiedDetailFailuresRef.current.has(failureKey)) return;
      notifiedDetailFailuresRef.current.add(failureKey);
      showToast(TEXTS.loadingError, 'error');
    },
    [currentItem, showToast],
  );

  useEffect(() => {
    if (noteLoadFailed) notifyDetailLoadFailure('note');
    if (grammarLoadFailed) notifyDetailLoadFailure('grammar');
  }, [grammarLoadFailed, noteLoadFailed, notifyDetailLoadFailure]);

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
      noteAvailable={noteAvailable}
      grammarAvailable={grammarAvailable}
      noteLoadFailed={noteLoadFailed}
      grammarLoadFailed={grammarLoadFailed}
      itemKey={currentItem ? String(currentItem.item_id) : undefined}
      ensureDetailLoaded={ensureDetailLoaded}
      onDetailLoadError={notifyDetailLoadFailure}
      progressLabel={progressLabel}
      progressHelpText={TEXTS.reviewProgress}
      showProgressLabel
      isBlockTrainingPractice={false}
      revealed={revealed}
      czech={czech}
      english={english}
      pronunciation={pronunciation}
      audioDisabled={audioDisabled}
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
