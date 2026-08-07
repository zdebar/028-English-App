import config from '@/config/config';
import { db } from '@/database/models/db';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import { liveQuery } from 'dexie';
import { useEffect } from 'react';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Keeps Home practice availability synchronized independently of the active route. */
export function usePracticeAvailabilityStoreSync(userId: string | null): void {
  const reset = usePracticeAvailabilityStore((state) => state.reset);
  const readySchedule = usePracticeAvailabilityStore((state) => state.readySchedule);

  useEffect(() => {
    if (!userId) {
      reset();
      return;
    }

    let isActive = true;
    usePracticeAvailabilityStore.setState({
      readyCount: 0,
      readySchedule: [],
      readyLoading: true,
      readyError: null,
      pronunciationCount: 0,
      pronunciationLoading: true,
      pronunciationError: null,
    });

    const readySubscription = liveQuery(() =>
      db.transaction('r', db.user_items, db.user_blocks, () =>
        UserItem.getReadyPracticeState(userId),
      ),
    ).subscribe({
      next: (state) => {
        if (!isActive) return;
        usePracticeAvailabilityStore.setState({
          readyCount: state.readyCount,
          readySchedule: state.schedule,
          readyLoading: false,
          readyError: null,
        });
      },
      error: (error) => {
        if (!isActive) return;
        const normalizedError = toError(error);
        usePracticeAvailabilityStore.setState({
          readyCount: 0,
          readySchedule: [],
          readyLoading: false,
          readyError: normalizedError,
        });
        reportError('Failed to load unified practice button state', normalizedError);
      },
    });

    const pronunciationSubscription = liveQuery(() =>
      UserItem.getPronunciationPracticeCount(userId),
    ).subscribe({
      next: (count) => {
        if (!isActive) return;
        usePracticeAvailabilityStore.setState({
          pronunciationCount: count,
          pronunciationLoading: false,
          pronunciationError: null,
        });
      },
      error: (error) => {
        if (!isActive) return;
        const normalizedError = toError(error);
        usePracticeAvailabilityStore.setState({
          pronunciationCount: 0,
          pronunciationLoading: false,
          pronunciationError: normalizedError,
        });
        reportError('Failed to load pronunciation practice button state', normalizedError);
      },
    });

    return () => {
      isActive = false;
      readySubscription.unsubscribe();
      pronunciationSubscription.unsubscribe();
    };
  }, [reset, userId]);

  useEffect(() => {
    if (readySchedule.length === 0) return;

    const nextTime = Date.parse(readySchedule[0].date);
    if (!Number.isFinite(nextTime)) {
      usePracticeAvailabilityStore.setState((state) => ({
        readySchedule: state.readySchedule.filter((entry) =>
          Number.isFinite(Date.parse(entry.date)),
        ),
      }));
      return;
    }

    const delay = Math.min(
      Math.max(nextTime - Date.now(), 0),
      config.practice.maxReadyScheduleTimerDelayMs,
    );
    const timeoutId = globalThis.setTimeout(() => {
      const now = Date.now();
      usePracticeAvailabilityStore.setState((state) => {
        let increment = 0;
        const nextSchedule = state.readySchedule.filter((entry) => {
          const entryTime = Date.parse(entry.date);
          if (!Number.isFinite(entryTime)) return false;
          if (entryTime <= now) {
            increment += entry.count;
            return false;
          }
          return true;
        });

        return {
          readyCount: state.readyCount + increment,
          readySchedule: nextSchedule,
        };
      });
    }, delay);

    return () => globalThis.clearTimeout(timeoutId);
  }, [readySchedule]);
}
