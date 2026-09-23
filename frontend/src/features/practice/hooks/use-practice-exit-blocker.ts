import { useCallback, useEffect, useRef } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';

type FinishPractice = (() => Promise<void>) | undefined;

const finishWithoutPersistence = (): Promise<void> => Promise.resolve();

/** Completes practice persistence before allowing the route to unmount. */
export function usePracticeExitBlocker(finishPractice: FinishPractice): void {
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname,
    [],
  );
  const blocker = useBlocker(shouldBlock);
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;
  const blockedLocationKey = blocker.state === 'blocked' ? blocker.location.key : null;

  useEffect(() => {
    if (!blockedLocationKey) return undefined;

    let isActive = true;
    const finish = finishPractice ?? finishWithoutPersistence;
    void finish()
      .catch(() => undefined)
      .then(() => {
        if (!isActive || blockerRef.current.state !== 'blocked') return;
        blockerRef.current.proceed();
      });

    return () => {
      isActive = false;
    };
  }, [blockedLocationKey, finishPractice]);
}
