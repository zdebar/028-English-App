import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * A custom React hook that ensures a minimum loading duration for UI feedback.
 * It prevents flickering by maintaining a loading state for at least the specified time,
 * even if the actual loading completes earlier.
 *
 * @param minLoadingTime - The minimum time in milliseconds to keep the loading state active.
 * @returns An object containing:
 *  - isLoading - Indicates if the loading state is active.
 *  - setIsLoading - Function to set the loading state.
 */
export function useMinLoading(minLoadingTime: number) {
  const [loading, setLoading] = useState(false);
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const setLoadingWithTimer = useCallback(
    (value: boolean) => {
      setLoading(value);
      if (!value) return;

      setMinLoadingElapsed(false);
      clearTimer();

      timerRef.current = setTimeout(() => {
        setMinLoadingElapsed(true);
        timerRef.current = null;
      }, minLoadingTime);
    },
    [clearTimer, minLoadingTime],
  );

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const isLoading = loading || !minLoadingElapsed;

  return { isLoading, setIsLoading: setLoadingWithTimer };
}
