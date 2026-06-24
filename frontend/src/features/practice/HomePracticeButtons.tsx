import StyledButton from '@/components/UI/buttons/StyledButton';
import { ROUTES } from '@/config/routes.config';
import UserBlock from '@/database/models/user-blocks';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import type { ReadyGrammarScheduleEntry } from '@/types/generic.types';
import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_TIMEOUT_DELAY_MS = 2_147_483_647;
const MAX_READY_GRAMMAR_BADGE_COUNT = 99;

type HomePracticeButtonsProps = Readonly<{
  userId: string;
}>;

export default function HomePracticeButtons({ userId }: HomePracticeButtonsProps): JSX.Element {
  const navigate = useNavigate();
  const [hasNewGrammarBlock, setHasNewGrammarBlock] = useState(false);
  const [readyGrammarCount, setReadyGrammarCount] = useState(0);
  const [readyGrammarSchedule, setReadyGrammarSchedule] = useState<ReadyGrammarScheduleEntry[]>([]);

  useEffect(() => {
    let isMounted = true;
    setHasNewGrammarBlock(false);
    setReadyGrammarCount(0);
    setReadyGrammarSchedule([]);

    const loadPracticeState = async () => {
      try {
        await UserBlock.unlockNextGrammarBlock(userId);
        const [newGrammarBlock, grammarPracticeState] = await Promise.all([
          UserBlock.getFirstUnlockedGrammarBlock(userId),
          UserBlock.getReadyGrammarPracticeState(userId),
        ]);

        if (!isMounted) {
          return;
        }

        setHasNewGrammarBlock(newGrammarBlock != null);
        setReadyGrammarCount(grammarPracticeState.readyCount);
        setReadyGrammarSchedule(grammarPracticeState.schedule);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setHasNewGrammarBlock(false);
        setReadyGrammarCount(0);
        setReadyGrammarSchedule([]);
        reportError('Failed to load practice button state', error);
      }
    };

    void loadPracticeState();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (readyGrammarSchedule.length === 0) {
      return;
    }

    const nextTime = Date.parse(readyGrammarSchedule[0].date);
    if (!Number.isFinite(nextTime)) {
      setReadyGrammarSchedule((schedule) =>
        schedule.filter((entry) => Number.isFinite(Date.parse(entry.date))),
      );
      return;
    }

    const delay = Math.min(Math.max(nextTime - Date.now(), 0), MAX_TIMEOUT_DELAY_MS);
    const timeoutId = globalThis.setTimeout(() => {
      const now = Date.now();
      let readyCountIncrement = 0;
      const nextSchedule = readyGrammarSchedule.filter((entry) => {
        const entryTime = Date.parse(entry.date);
        if (!Number.isFinite(entryTime)) {
          return false;
        }
        if (entryTime <= now) {
          readyCountIncrement += entry.count;
          return false;
        }
        return true;
      });

      if (readyCountIncrement > 0) {
        setReadyGrammarCount((count) => count + readyCountIncrement);
      }
      setReadyGrammarSchedule(nextSchedule);
    }, delay);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [readyGrammarSchedule]);

  const readyGrammarBadgeLabel =
    readyGrammarCount > MAX_READY_GRAMMAR_BADGE_COUNT
      ? `${MAX_READY_GRAMMAR_BADGE_COUNT}+`
      : String(readyGrammarCount);

  return (
    <div className="my-4 flex flex-col gap-2">
      <StyledButton className="h-button px-4" onClick={() => navigate(ROUTES.practiceVocabulary)}>
        {TEXTS.vocabularyPracticeButton}
      </StyledButton>
      <StyledButton
        className="h-button px-4"
        disabled={!hasNewGrammarBlock}
        onClick={() => navigate(ROUTES.practiceNewGrammar)}
      >
        {TEXTS.newGrammarPracticeButton}
      </StyledButton>
      <StyledButton
        className="h-button relative px-4"
        disabled={readyGrammarCount === 0}
        onClick={() => navigate(ROUTES.practiceGrammar)}
      >
        {TEXTS.grammarPracticeButton}
        {readyGrammarCount > 0 && (
          <span className="bg-button-hover text-light absolute top-1 right-2 min-w-6 rounded-full px-1 text-xs">
            {readyGrammarBadgeLabel}
          </span>
        )}
      </StyledButton>
    </div>
  );
}
