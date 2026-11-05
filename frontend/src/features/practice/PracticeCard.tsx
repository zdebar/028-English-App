import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from './hooks/use-practice-deck';
import PracticeSessionCard, { type PracticeDetail } from './PracticeSessionCard';
import PracticeEmptyState from './PracticeEmptyState';
import { TEXTS } from '@/locales/cs';
import DelayedNotification from '@/components/UI/DelayedNotification';
import { useToastStore } from '../toast/use-toast-store';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReviewKind } from '@/types/practice.types';
import { usePracticeExitBlocker } from './hooks/use-practice-exit-blocker';
import { formatProgress } from '@/utils/progress.utils';
import { ROUTES } from '@/config/routes.config';
import type { UserItemLocal } from '@/types/user-item.types';

type PracticeCardProps = Readonly<{
  reviewKind?: ReviewKind;
}>;

export default function PracticeCard({ reviewKind = 'grammar' }: PracticeCardProps) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const handlePracticeComplete = useCallback(() => {
    void navigate(ROUTES.home, { replace: true });
  }, [navigate]);
  const deck = usePracticeDeck(userId, reviewKind, handlePracticeComplete);

  usePracticeExitBlocker(deck.finishPractice);
  const notifyDetailLoadFailure = usePracticeDetailFailureNotifier(
    deck.currentItem,
    deck.noteLoadFailed,
    deck.grammarLoadFailed,
    showToast,
  );

  useQueryErrorToast(deck.error, 'Failed to fetch practice deck');

  return <PracticeCardBody deck={deck} onDetailLoadError={notifyDetailLoadFailure} />;
}

type PracticeCardBodyProps = Readonly<{
  deck: ReturnType<typeof usePracticeDeck>;
  onDetailLoadError: (detail: PracticeDetail) => void;
}>;

function PracticeCardBody({ deck, onDetailLoadError }: PracticeCardBodyProps) {
  const { currentItem } = deck;
  if (deck.loading && !currentItem) {
    return <DelayedNotification />;
  }

  if (deck.finishedReview) return null;

  if (!currentItem) {
    return <PracticeEmptyState />;
  }

  return (
    <PracticeSessionCard
      note={deck.note}
      grammar={deck.grammar}
      soundGroups={deck.soundGroups}
      noteAvailable={deck.noteAvailable}
      grammarAvailable={deck.grammarAvailable}
      noteLoadFailed={deck.noteLoadFailed}
      grammarLoadFailed={deck.grammarLoadFailed}
      itemKey={String(currentItem.item_id)}
      ensureDetailLoaded={deck.ensureDetailLoaded}
      onDetailLoadError={onDetailLoadError}
      itemProgressLabel={formatProgress(
        currentItem.review_direction === 'en_to_cz'
          ? currentItem.progress_en_to_cz
          : currentItem.progress_cz_to_en,
      ) ?? ''}
      progressLabel={deck.progressLabel}
      progressHelpText={TEXTS.reviewProgress}
      showProgressLabel
      isReviewPractice
      isInitialTrainingPractice={false}
      revealed={deck.revealed}
      czech={currentItem.review_direction === 'en_to_cz' ? currentItem.czech : deck.czech}
      czechDescription={currentItem.czech_description}
      czechHidden={currentItem.review_direction === 'en_to_cz' && !deck.revealed}
      english={deck.english}
      pronunciation={deck.pronunciation}
      audio={currentItem.audio}
      audioDisabled={deck.audioDisabled}
      handleReveal={deck.handleReveal}
      plusHint={deck.plusHint}
      nextRepeat={() => deck.nextItem('repeat')}
      nextKnown={() => deck.nextItem('known')}
      nextEasy={() => deck.nextItem('easy')}
      retryAction={deck.retryPractice}
      audioError={deck.audioError}
      playAudio={deck.playAudio}
      audioLoading={deck.audioLoading}
      isContentLoading={deck.loading}
    />
  );
}

function usePracticeDetailFailureNotifier(
  currentItem: UserItemLocal | null,
  noteLoadFailed: boolean,
  grammarLoadFailed: boolean,
  showToast: (message: string, type: 'error') => void,
): (detail: PracticeDetail) => void {
  const notifiedDetailFailuresRef = useRef(new Set<string>());
  const notifyDetailLoadFailure = useCallback((detail: PracticeDetail): void => {
    if (!currentItem) return;
    const failureKey = `${currentItem.item_id}:${detail}`;
    if (notifiedDetailFailuresRef.current.has(failureKey)) return;
    notifiedDetailFailuresRef.current.add(failureKey);
    showToast(TEXTS.loadingError, 'error');
  }, [currentItem, showToast]);

  useEffect(() => {
    if (noteLoadFailed) notifyDetailLoadFailure('note');
    if (grammarLoadFailed) notifyDetailLoadFailure('grammar');
  }, [grammarLoadFailed, noteLoadFailed, notifyDetailLoadFailure]);
  return notifyDetailLoadFailure;
}
