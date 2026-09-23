import { useCallback, useEffect, useRef } from 'react';
import { beginPracticeAvailabilityBoundary } from '../practice-availability-controller';

type PracticeWrite = <T>(operation: Promise<T>) => Promise<T>;
type PracticeFlush = () => Promise<void>;

export type PracticeAvailabilityBoundary = Readonly<{
  trackPracticeWrite: PracticeWrite;
  finishPractice: () => Promise<void>;
}>;

/** Keeps per-answer persistence independent from Home's availability snapshot. */
export function usePracticeAvailabilityBoundary(
  userId: string | null,
  flushPractice?: PracticeFlush,
): PracticeAvailabilityBoundary {
  const pending = useRef(new Set<Promise<unknown>>());
  const finishRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!userId) return undefined;
    const endPractice = beginPracticeAvailabilityBoundary(userId);
    const writes = pending.current;
    let finishPromise: Promise<void> | null = null;
    const finishPractice = (): Promise<void> => {
      if (finishPromise) return finishPromise;
      finishPromise = Promise.resolve(flushPractice?.())
        .catch(() => undefined)
        .then(() => Promise.allSettled(writes))
        .then(endPractice);
      return finishPromise;
    };
    finishRef.current = finishPractice;

    return () => {
      void finishPractice();
      if (finishRef.current === finishPractice) finishRef.current = null;
    };
  }, [flushPractice, userId]);

  const trackPracticeWrite = useCallback<PracticeWrite>((operation) => {
    pending.current.add(operation);
    const remove = () => {
      pending.current.delete(operation);
    };
    void operation.then(remove, remove);
    return operation;
  }, []);

  const finishPractice = useCallback(async () => {
    await finishRef.current?.();
  }, []);

  return { trackPracticeWrite, finishPractice };
}
