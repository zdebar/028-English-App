import config from '@/config/config';
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

export default function PracticeCard() {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const {
    currentItem,
    triggerBlockId,
    noteId,
    grammarChunkId,
    progress,
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
  } = usePracticeDeck(userId);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch practice deck', error);
  }, [error, showToast]);

  useEffect(() => {
    if (triggerBlockId == null) return;
    navigate(ROUTES.practiceNewGrammar, { state: { blockId: triggerBlockId } });
  }, [navigate, triggerBlockId]);

  if (triggerBlockId != null) {
    return <DelayedLoadingCircle />;
  }

  if (loading && !currentItem) {
    return <DelayedLoadingCircle />;
  }

  if (!currentItem) {
    return <PracticeEmptyState />;
  }

  return (
    <PracticeSessionCard
      noteId={noteId}
      grammarChunkId={grammarChunkId}
      progressLabel={progress}
      isCzToEn={isCzToEn}
      revealed={revealed}
      czech={czech}
      english={english}
      pronunciation={pronunciation}
      audioDisabled={audioDisabled}
      showDirectionChange={showDirectionChange}
      handleReveal={handleReveal}
      plusHint={plusHint}
      nextRepeat={() => nextItem(config.progress.minusProgress)}
      nextKnown={() => nextItem(config.progress.plusProgress)}
      completeCurrent={() => nextItem(config.progress.skipProgress)}
      audioError={audioError}
      playAudio={playAudio}
      audioLoading={audioLoading}
    />
  );
}
