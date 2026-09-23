import { useCallback, useEffect, useRef } from 'react';
import { beginPracticeAvailabilityBoundary } from '../practice-availability-controller';

/** Keeps per-answer persistence independent from Home's availability snapshot. */
export function usePracticeAvailabilityBoundary(userId: string | null) {
  const pending = useRef(new Set<Promise<unknown>>());

  useEffect(() => {
    if (!userId) return;
    const endPractice = beginPracticeAvailabilityBoundary(userId);
    const writes = pending.current;
    return () => {
      void Promise.allSettled(writes).then(endPractice);
    };
  }, [userId]);

  return useCallback(<T,>(operation: Promise<T>): Promise<T> => {
    pending.current.add(operation);
    const remove = () => { pending.current.delete(operation); };
    void operation.then(remove, remove);
    return operation;
  }, []);
}
