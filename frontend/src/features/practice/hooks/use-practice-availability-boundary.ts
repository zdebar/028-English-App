import { useCallback, useEffect, useRef } from 'react';

type PracticeWrite = <T>(operation: Promise<T>) => Promise<T>;
type PracticeFlush = () => Promise<void>;

export type PracticeAvailabilityBoundary = Readonly<{
  trackPracticeWrite: PracticeWrite;
  finishPractice: () => Promise<void>;
}>;

/** Tracks in-flight practice operations so route exit waits for their persistence. */
export function usePracticeAvailabilityBoundary(
  userId: string | null,
  flushPractice?: PracticeFlush,
): PracticeAvailabilityBoundary {
  const pending = useRef(new Set<Promise<unknown>>());
  const finishRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!userId) return undefined;
    const writes = pending.current;
    let finishPromise: Promise<void> | null = null;
    const finishPractice = (): Promise<void> => {
      if (finishPromise) return finishPromise;
      finishPromise = Promise.allSettled(writes)
        .then(() => flushPractice?.())
        .catch(() => undefined);
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
