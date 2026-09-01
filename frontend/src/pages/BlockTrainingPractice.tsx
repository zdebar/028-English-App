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
  onCompletionContinue,
}: Readonly<{
  deck: InitialTrainingDeck;
  introDismissed: boolean;
  dismissIntro: () => void;
  onCompletionContinue: () => void;
}>): JSX.Element {
  if (deck.loading) return <DelayedLoadingCircle />;
  if (deck.isComplete) {
    return (
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel={deck.progressLabel}
        progressHelpText={TEXTS.progress}
        isBlockTrainingPractice
        isCompletion
        onCompletionContinue={onCompletionContinue}
        isCzToEn={deck.isCzToEn}
        revealed={false}
        czech={undefined}
        english={undefined}
        pronunciation={undefined}
        audioDisabled
        showDirectionChange={false}
        handleReveal={() => undefined}
        plusHint={() => undefined}
        nextRepeat={() => undefined}
        nextKnown={() => undefined}
        completeCurrent={() => undefined}
        audioError={false}
        playAudio={() => undefined}
        audioLoading={false}
      />
    );
  }
  if (!deck.hasContent && !deck.currentItem) return <PracticeEmptyState />;
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
      pronunciationItem={deck.currentItem}
    />
  );
}

export default function InitialTrainingPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [introDismissed, setIntroDismissed] = useState(false);
  const initialData = useLoaderData() as InitialTrainingData;
  const deck = useInitialTrainingDeck(userId, initialData);

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
      onCompletionContinue={() => navigate(ROUTES.home, { replace: true })}
    />
  );
}
