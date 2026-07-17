import StyledButton from '@/components/UI/buttons/StyledButton';
import config from '@/config/config';
import { ROUTES } from '@/config/routes.config';
import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import { useSyncStore } from '@/features/synchronization/use-sync-store';
import { TEXTS } from '@/locales/cs';
import type { ReadyPracticeScheduleEntry } from '@/types/generic.types';
import { useEffect, useState, type Dispatch, type JSX, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';

type HomePracticeButtonsProps = Readonly<{
  userId: string;
}>;

function getReadyPracticeBadgeLabel(count: number): string {
  const badgeCap = config.practice.readyPracticeBadgeCap;
  return count > badgeCap ? `${badgeCap}+` : String(count);
}

function useReadyPracticeSchedule(
  schedule: ReadyPracticeScheduleEntry[],
  setReadyCount: Dispatch<SetStateAction<number>>,
  setSchedule: Dispatch<SetStateAction<ReadyPracticeScheduleEntry[]>>,
): void {
  useEffect(() => {
    if (schedule.length === 0) {
      return;
    }

    const nextTime = Date.parse(schedule[0].date);
    if (!Number.isFinite(nextTime)) {
      setSchedule((currentSchedule) =>
        currentSchedule.filter((entry) => Number.isFinite(Date.parse(entry.date))),
      );
      return;
    }

    const delay = Math.min(
      Math.max(nextTime - Date.now(), 0),
      config.practice.maxReadyScheduleTimerDelayMs,
    );
    const timeoutId = globalThis.setTimeout(() => {
      const now = Date.now();
      let readyCountIncrement = 0;
      const nextSchedule = schedule.filter((entry) => {
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
        setReadyCount((count) => count + readyCountIncrement);
      }
      setSchedule(nextSchedule);
    }, delay);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [schedule, setReadyCount, setSchedule]);
}

function ReadyPracticeBadge({ count }: Readonly<{ count: number }>): JSX.Element | null {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="bg-button-hover text-light absolute top-1 right-2 min-w-6 rounded-full px-1 text-xs">
      {getReadyPracticeBadgeLabel(count)}
    </span>
  );
}

export default function HomePracticeButtons({ userId }: HomePracticeButtonsProps): JSX.Element {
  const navigate = useNavigate();
  const syncRevision = useSyncStore((state) => state.syncRevision);
  const [progressRevision, setProgressRevision] = useState(0);
  const [readyVocabularyCount, setReadyVocabularyCount] = useState(0);
  const [readyVocabularySchedule, setReadyVocabularySchedule] = useState<
    ReadyPracticeScheduleEntry[]
  >([]);
  const [hasNewGrammarBlock, setHasNewGrammarBlock] = useState(false);
  const [readyGrammarCount, setReadyGrammarCount] = useState(0);
  const [readyGrammarSchedule, setReadyGrammarSchedule] = useState<ReadyPracticeScheduleEntry[]>([]);

  useEffect(() => {
    const handleLevelsUpdated = (event: Event) => {
      const updatedUserId = (event as CustomEvent<{ userId?: string }>).detail?.userId;
      if (updatedUserId === userId) {
        setProgressRevision((revision) => revision + 1);
      }
    };

    globalThis.addEventListener('levelsUpdated', handleLevelsUpdated);
    return () => globalThis.removeEventListener('levelsUpdated', handleLevelsUpdated);
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    setReadyVocabularyCount(0);
    setReadyVocabularySchedule([]);
    setHasNewGrammarBlock(false);
    setReadyGrammarCount(0);
    setReadyGrammarSchedule([]);

    const loadPracticeState = async () => {
      try {
        await UserBlock.unlockNextGrammarBlock(userId);
        const [vocabularyPracticeState, newGrammarBlock, grammarPracticeState] = await Promise.all([
          UserItem.getReadyVocabularyPracticeState(userId),
          UserBlock.getFirstUnlockedGrammarBlock(userId),
          UserBlock.getReadyGrammarPracticeState(userId),
        ]);

        if (!isMounted) {
          return;
        }

        setReadyVocabularyCount(vocabularyPracticeState.readyCount);
        setReadyVocabularySchedule(vocabularyPracticeState.schedule);
        setHasNewGrammarBlock(newGrammarBlock != null);
        setReadyGrammarCount(grammarPracticeState.readyCount);
        setReadyGrammarSchedule(grammarPracticeState.schedule);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setReadyVocabularyCount(0);
        setReadyVocabularySchedule([]);
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
  }, [progressRevision, syncRevision, userId]);

  useReadyPracticeSchedule(
    readyVocabularySchedule,
    setReadyVocabularyCount,
    setReadyVocabularySchedule,
  );
  useReadyPracticeSchedule(readyGrammarSchedule, setReadyGrammarCount, setReadyGrammarSchedule);

  return (
    <div className="my-4 flex flex-col gap-2">
      <StyledButton
        className="h-button relative px-4"
        disabled={readyVocabularyCount === 0}
        onClick={() => navigate(ROUTES.practiceVocabulary)}
      >
        {TEXTS.vocabularyPracticeButton}
        <ReadyPracticeBadge count={readyVocabularyCount} />
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
        <ReadyPracticeBadge count={readyGrammarCount} />
      </StyledButton>
    </div>
  );
}
