import config from '@/config/config';
import { ROUTES } from '@/config/routes.config';
import DelayedNotification from '@/components/UI/DelayedNotification';
import StyledButton from '@/components/UI/buttons/StyledButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePracticeDeck } from './hooks/use-practice-deck';
import type { ReviewPracticeMode } from '@/types/user-item.types';
import PracticeSessionCard from './PracticeSessionCard';
import { TEXTS } from '@/locales/cs';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
  } = usePracticeDeck(userId, mode);

  if (!currentItem) {
    return (
      <DelayedNotification>
        <p>{TEXTS.nothingToPractice}</p>
        <p>{TEXTS.tryAgainLater}</p>
        <StyledButton
          className="h-button mt-2 w-full text-base"
          onClick={() => navigate(ROUTES.home)}
        >
          {TEXTS.tooltipHome}
        </StyledButton>
      </DelayedNotification>
    );
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
