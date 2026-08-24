import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';
import Notification from '@/components/UI/Notification';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import BlockTrainingOverviewCard from '@/features/practice/BlockTrainingOverviewCard';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useBlockTrainingDeck } from '@/features/practice/hooks/use-block-training-deck';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import type { BlockTrainingData } from '@/routing/route-data';

export default function BlockTrainingPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [showIntro, setShowIntro] = useState(true);
  const initialData = useLoaderData() as BlockTrainingData;
  const blockId = initialData.block?.block_id ?? null;
  const deck = useBlockTrainingDeck(userId, blockId, initialData);

  useEffect(() => {
    if (!deck.error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch block training deck', deck.error);
  }, [deck.error, showToast]);

  useEffect(() => {
    if (deck.hasProgress) setShowIntro(false);
  }, [deck.hasProgress]);

  useEffect(() => {
    if (deck.isComplete) navigate(ROUTES.home, { replace: true });
  }, [deck.isComplete, navigate]);

  if (!userId) {
    return <Notification>{TEXTS.notAvailable}</Notification>;
  }

  if (deck.loading) {
    return <DelayedLoadingCircle />;
  }

  if (!deck.block) {
    return <PracticeEmptyState />;
  }

  if (deck.isComplete) return <DelayedLoadingCircle />;

  if (!deck.currentItem) {
    return <PracticeEmptyState />;
  }

  if (showIntro) {
    return (
      <BlockTrainingOverviewCard
        block={deck.block}
        grammar={deck.grammar}
        grammarGroup={deck.grammarGroup}
        items={deck.items}
        onContinue={() => setShowIntro(false)}
      />
    );
  }

  return (
    <PracticeSessionCard
      note={deck.note}
      grammar={deck.practiceGrammar}
      progressLabel={deck.progressLabel}
      celebratingStar={deck.celebratingStar}
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
