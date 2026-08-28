import { useCallback, useEffect, useRef, useState } from 'react';

export function useStarCelebration() {
  const [celebratingStar, setCelebratingStar] = useState(false);
  const acknowledgementRef = useRef<(() => void) | null>(null);

  const waitForAcknowledgement = useCallback(() => {
    setCelebratingStar(true);
    return new Promise<void>((resolve) => {
      acknowledgementRef.current = resolve;
    });
  }, []);

  const acknowledgeCelebration = useCallback(() => {
    const acknowledge = acknowledgementRef.current;
    acknowledgementRef.current = null;
    acknowledge?.();
  }, []);

  const finishCelebration = useCallback(() => {
    acknowledgementRef.current = null;
    setCelebratingStar(false);
  }, []);

  useEffect(
    () => () => {
      const acknowledge = acknowledgementRef.current;
      acknowledgementRef.current = null;
      acknowledge?.();
    },
    [],
  );

  return {
    celebratingStar,
    waitForAcknowledgement,
    acknowledgeCelebration,
    finishCelebration,
  };
}
