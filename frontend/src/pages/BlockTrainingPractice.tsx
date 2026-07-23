import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';
import Notification from '@/components/UI/Notification';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import BlockTrainingOverviewCard from '@/features/practice/BlockTrainingOverviewCard';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useBlockTrainingDeck } from '@/features/practice/hooks/use-block-training-deck';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type JSX } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BlockTrainingPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToastStore((state) => state.showToast);
  const [showIntro, setShowIntro] = useState(true);
  const state = location.state as { blockId?: unknown } | null;
  const blockId = typeof state?.blockId === 'number' ? state.blockId : null;
  const deck = useBlockTrainingDeck(userId, blockId);

  useEffect(() => {
    if (!deck.error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch block training deck', deck.error);
  }, [deck.error, showToast]);

  if (!userId) {
    return <Notification>{TEXTS.notAvailable}</Notification>;
  }

  if (deck.loading) {
    return <DelayedLoadingCircle />;
  }

  if (!deck.block) {
    return <PracticeEmptyState />;
  }

  if (deck.isComplete) {
    return (
      <div className="card-width mt-8 flex flex-col gap-4 text-center">
        <p>{TEXTS.blockTrainingComplete}</p>
        <Notification>{deck.block.name}</Notification>
        <ReturnHomeButton
          onClick={(event) => {
            event.preventDefault();
            navigate(ROUTES.practice, { replace: true });
          }}
        >
          {TEXTS.continuePractice}
        </ReturnHomeButton>
      </div>
    );
  }

  if (!deck.currentItem) {
    return <PracticeEmptyState />;
  }

  if (showIntro) {
    return (
      <BlockTrainingOverviewCard
        block={deck.block}
        grammar={deck.grammar}
        onContinue={() => setShowIntro(false)}
      />
    );
  }

  return (
    <PracticeSessionCard
      noteId={deck.noteId}
      grammarChunkId={deck.grammarChunkId}
      progressLabel={deck.progressLabel}
      isCzToEn={deck.isCzToEn}
      revealed={deck.revealed}
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
      isBlockTrainingPractice
    />
  );
}
