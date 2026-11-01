import DelayedNotification from '@/components/UI/DelayedNotification';
import Notification from '@/components/UI/Notification';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import LessonTrainingOverviewCard from '@/features/practice/LessonTrainingOverviewCard';
import PracticeEmptyState from '@/features/practice/PracticeEmptyState';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';
import { useInitialTrainingDeck } from '@/features/practice/hooks/use-initial-training-deck';
import { usePracticeExitBlocker } from '@/features/practice/hooks/use-practice-exit-blocker';
import { TEXTS } from '@/locales/cs';
import { formatProgress } from '@/utils/progress.utils';
import { useCallback, useState, type JSX } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import type { InitialTrainingData } from '@/features/practice/initial-training-data';

type InitialTrainingDeck = ReturnType<typeof useInitialTrainingDeck>;

function InitialTrainingContent({
  deck,
  introDismissed,
  dismissIntro,
}: Readonly<{
  deck: InitialTrainingDeck;
  introDismissed: boolean;
  dismissIntro: () => void;
}>): JSX.Element | null {
  if (deck.loading) return <DelayedNotification />;
  if (deck.isComplete) return null;
  if (!deck.currentItem) return <PracticeEmptyState />;

  if (deck.lesson && !deck.hasProgress && !introDismissed) {
    return (
      <LessonTrainingOverviewCard
        lesson={deck.lesson}
        groupNote={deck.groupNote}
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
      czechDescription={deck.currentItem.czech_description}
      english={deck.english}
      pronunciation={deck.pronunciation}
      audio={deck.currentItem.audio}
      audioDisabled={deck.audioDisabled}
      handleReveal={deck.handleReveal}
      plusHint={deck.plusHint}
      nextRepeat={deck.nextRepeat}
      nextKnown={deck.nextKnown}
      completeCurrent={deck.completeCurrent}
      audioError={deck.audioError}
      playAudio={deck.playAudio}
      audioLoading={deck.audioLoading}
      isInitialTrainingPractice
    />
  );
}

export default function InitialTrainingPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const [introDismissed, setIntroDismissed] = useState(false);
  const initialData = useLoaderData() as InitialTrainingData;
  const handlePracticeComplete = useCallback(() => {
    void navigate(ROUTES.home, { replace: true });
  }, [navigate]);
  const deck = useInitialTrainingDeck(userId, initialData, handlePracticeComplete);
  usePracticeExitBlocker(deck.finishPractice);
  useQueryErrorToast(deck.error, 'Failed to fetch initial training deck');

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
