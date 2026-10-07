import DelayedMessage from '@/components/UI/DelayedMessage';
import Notification from '@/components/UI/Notification';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import BlockTrainingOverviewCard from '@/features/practice/BlockTrainingOverviewCard';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useInitialTrainingDeck } from '@/features/practice/hooks/use-block-training-deck';
import { usePracticeExitBlocker } from '@/features/practice/hooks/use-practice-exit-blocker';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { formatProgress } from '@/utils/progress.utils';
import { useCallback, useEffect, useState, type JSX } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import type { InitialTrainingData } from '@/routing/route-data';

type InitialTrainingDeck = ReturnType<typeof useInitialTrainingDeck>;

function reportInitialTrainingError(
  error: Error | null,
  showToast: (message: string, type: 'error') => void,
): void {
  if (!error) return;
  showToast(TEXTS.loadingError, 'error');
  reportError('Failed to fetch initial training deck', error);
}


function InitialTrainingContent({
  deck,
  introDismissed,
  dismissIntro,
}: Readonly<{
  deck: InitialTrainingDeck;
  introDismissed: boolean;
  dismissIntro: () => void;
}>): JSX.Element | null {
  if (deck.loading) return <DelayedMessage />;
  if (deck.isComplete) return null;
  if (!deck.currentItem) return <PracticeEmptyState />;

  const showIntro = Boolean(deck.block) && !deck.hasProgress && !introDismissed;
  if (showIntro && deck.block) {
    return (
      <BlockTrainingOverviewCard
        block={deck.block}
        grammar={deck.grammar}
        grammarGroup={deck.grammarGroup}
        items={deck.items}
        onContinue={dismissIntro}
      />
    );
  }

  return (
    <PracticeSessionCard
      note={deck.note}
      grammar={deck.practiceGrammar}
      itemProgressLabel={formatProgress(deck.currentItem.progress_cz_to_en) ?? ''}
      progressLabel={deck.progressLabel}
      revealed={deck.revealed}
      czech={deck.czech}
      english={deck.english}
      pronunciation={deck.pronunciation}
      audioDisabled={deck.audioDisabled}
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

export default function InitialTrainingPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const [introDismissed, setIntroDismissed] = useState(false);
  const initialData = useLoaderData() as InitialTrainingData;
  const handlePracticeComplete = useCallback(() => {
    navigate(ROUTES.home, { replace: true });
  }, [navigate]);
  const deck = useInitialTrainingDeck(userId, initialData, handlePracticeComplete);
  usePracticeExitBlocker(deck.finishPractice);

  useEffect(() => {
    reportInitialTrainingError(deck.error, showToast);
  }, [deck.error, showToast]);

  if (!userId) {
    return <Notification>{TEXTS.notAvailable}</Notification>;
  }

  return (
    <InitialTrainingContent
      deck={deck}
      introDismissed={introDismissed}
      dismissIntro={() => setIntroDismissed(true)}
    />
  );
}
