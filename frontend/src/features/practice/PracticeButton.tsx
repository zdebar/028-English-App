import StyledButton from '@/components/UI/buttons/StyledButton';
import config from '@/config/config';
import { ROUTES } from '@/config/routes.config';
import { db } from '@/database/models/db';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import type { ReadyPracticeScheduleEntry } from '@/types/generic.types';
import { liveQuery } from 'dexie';
import { useEffect, useState, type Dispatch, type JSX, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';

type PracticeButtonProps = Readonly<{ userId: string }>;

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
    if (schedule.length === 0) return;

    const nextTime = Date.parse(schedule[0].date);
    if (!Number.isFinite(nextTime)) {
      setSchedule((current) => current.filter((entry) => Number.isFinite(Date.parse(entry.date))));
      return;
    }

    const delay = Math.min(
      Math.max(nextTime - Date.now(), 0),
      config.practice.maxReadyScheduleTimerDelayMs,
    );
    const timeoutId = globalThis.setTimeout(() => {
      const now = Date.now();
      let increment = 0;
      const nextSchedule = schedule.filter((entry) => {
        const entryTime = Date.parse(entry.date);
        if (!Number.isFinite(entryTime)) return false;
        if (entryTime <= now) {
          increment += entry.count;
          return false;
        }
        return true;
      });
      if (increment > 0) setReadyCount((count) => count + increment);
      setSchedule(nextSchedule);
    }, delay);

    return () => globalThis.clearTimeout(timeoutId);
  }, [schedule, setReadyCount, setSchedule]);
}

function ReadyPracticeBadge({ count }: Readonly<{ count: number }>): JSX.Element | null {
  if (count <= 0) return null;
  return (
    <span className="bg-button-hover text-light absolute top-1 right-2 min-w-5 rounded-full px-2 text-xs">
      {getReadyPracticeBadgeLabel(count)}
    </span>
  );
}

export default function PracticeButton({ userId }: PracticeButtonProps): JSX.Element {
  const badgeCap = config.practice.readyPracticeBadgeCap;

  const navigate = useNavigate();
  const [readyCount, setReadyCount] = useState(0);
  const [readySchedule, setReadySchedule] = useState<ReadyPracticeScheduleEntry[]>([]);

  useEffect(() => {
    let isActive = true;
    setReadyCount(0);
    setReadySchedule([]);

    const subscription = liveQuery(() =>
      db.transaction('r', db.user_items, db.user_blocks, () =>
        UserItem.getReadyPracticeState(userId),
      ),
    ).subscribe({
      next: (state) => {
        if (!isActive) return;
        setReadyCount(state.readyCount);
        setReadySchedule(state.schedule);
      },
      error: (error) => {
        if (!isActive) return;
        setReadyCount(0);
        setReadySchedule([]);
        reportError('Failed to load unified practice button state', error);
      },
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [userId]);

  useReadyPracticeSchedule(readySchedule, setReadyCount, setReadySchedule);

  return (
    <StyledButton
      className="h-button relative my-4 px-4"
      disabled={readyCount === 0}
      onClick={() => navigate(ROUTES.practice)}
    >
      {TEXTS.practiceButton}
      {readyCount < badgeCap && <ReadyPracticeBadge count={readyCount} />}
    </StyledButton>
  );
}
