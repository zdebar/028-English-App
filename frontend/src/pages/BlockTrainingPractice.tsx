import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';
import Notification from '@/components/UI/Notification';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import BlockTrainingOverviewCard from '@/features/practice/BlockTrainingOverviewCard';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useInitialTrainingDeck } from '@/features/practice/hooks/use-block-training-deck';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import type { InitialTrainingData } from '@/routing/route-data';

export default function InitialTrainingPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [introDismissed, setIntroDismissed] = useState(false);
  const initialData = useLoaderData() as InitialTrainingData;
  const deck = useInitialTrainingDeck(userId, initialData);

  useEffect(() => {
    if (!deck.error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch initial training deck', deck.error);
  }, [deck.error, showToast]);

  useEffect(() => {
    if (deck.isComplete) navigate(ROUTES.home, { replace: true });
  }, [deck.isComplete, navigate]);

  if (!userId) {
    return <Notification>{TEXTS.notAvailable}</Notification>;
  }

  if (deck.loading) {
    return <DelayedLoadingCircle />;
  }

  if (!deck.hasContent && !deck.currentItem) {
    return <PracticeEmptyState />;
  }

  if (deck.isComplete) return <DelayedLoadingCircle />;

  if (!deck.currentItem) {
    return <PracticeEmptyState />;
  }

  const showIntro = Boolean(deck.block) && !deck.hasProgress && !introDismissed;
  if (showIntro && deck.block) {
    return (
      <BlockTrainingOverviewCard
        block={deck.block}
        grammar={deck.grammar}
        grammarGroup={deck.grammarGroup}
        items={deck.items}
        onContinue={() => setIntroDismissed(true)}
      />
    );
  }

  return (
    <PracticeSessionCard
      note={deck.note}
      grammar={deck.practiceGrammar}
      progressLabel={deck.progressLabel}
      celebratingStar={deck.celebratingStar}
      celebrationStarTier={deck.celebrationStarTier}
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
      pronunciationItem={deck.currentItem}
    />
  );
}
