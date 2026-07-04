import config from '@/config/config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from './hooks/use-practice-deck';
import type { ReviewPracticeMode } from '@/types/user-item.types';
import PracticeSessionCard from './PracticeSessionCard';
import PracticeEmptyState from './PracticeEmptyState';
import { TEXTS } from '@/locales/cs';
import { DataState } from '@/components/UI/DataState';
import { useToastStore } from '../toast/use-toast-store';
import { reportError } from '../logging/monitoring-handler';
import { useEffect } from 'react';

type PracticeCardProps = Readonly<{
  mode?: ReviewPracticeMode;
}>;

/**
 * PracticeCard component for interactive language practice.
 *
 * @returns The main practice card UI with all practice controls and feedback.
 */
export default function PracticeCard({ mode = 'vocabulary' }: PracticeCardProps) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const {
    currentItem,
    noteId,
    grammarId,
    progress,
    isCzToEn,
    revealed,
    handleReveal,
    showNewGrammarIndicator,
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
  } = usePracticeDeck(userId, mode);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch practice deck', error);
  }, [error, showToast]);

  if (loading && !currentItem) {
    return <DataState loading hasData={false} noDataMessage={TEXTS.nothingToPractice} />;
  }

  if (!currentItem) {
    return <PracticeEmptyState />;
  }

  return (
    <PracticeSessionCard
      noteId={noteId}
      grammarId={grammarId}
      progressLabel={progress}
      isCzToEn={isCzToEn}
      revealed={revealed}
      showNewGrammarIndicator={showNewGrammarIndicator}
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
