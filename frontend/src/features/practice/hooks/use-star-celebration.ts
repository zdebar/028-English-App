import { useCallback, useEffect, useRef, useState } from 'react';

export function useStarCelebration() {
  const [celebratingStar, setCelebratingStar] = useState(false);
  const [preparingCelebration, setPreparingCelebration] = useState(false);
  const acknowledgementRef = useRef<(() => void) | null>(null);

  const createAcknowledgement = useCallback(() => {
    return new Promise<void>((resolve) => {
      acknowledgementRef.current = resolve;
    });
  }, []);

  const waitForAcknowledgement = useCallback(() => {
    setPreparingCelebration(false);
    setCelebratingStar(true);
    return createAcknowledgement();
  }, [createAcknowledgement]);

  const prepareAcknowledgement = useCallback(() => {
    setPreparingCelebration(true);
    return createAcknowledgement();
  }, [createAcknowledgement]);

  const showCelebration = useCallback(() => {
    setPreparingCelebration(false);
    setCelebratingStar(true);
  }, []);

  const acknowledgeCelebration = useCallback(() => {
    const acknowledge = acknowledgementRef.current;
    acknowledgementRef.current = null;
    acknowledge?.();
  }, []);

  const finishCelebration = useCallback(() => {
    const acknowledge = acknowledgementRef.current;
    acknowledgementRef.current = null;
    acknowledge?.();
    setPreparingCelebration(false);
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
    preparingCelebration,
    waitForAcknowledgement,
    prepareAcknowledgement,
    showCelebration,
    acknowledgeCelebration,
    finishCelebration,
  };
}
