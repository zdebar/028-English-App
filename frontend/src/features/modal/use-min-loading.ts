import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * A custom React hook that ensures a minimum loading duration for UI feedback.
 * It prevents flickering by maintaining a loading state for at least the specified time,
 * even if the actual loading completes earlier.
 *
 * @param minLoadingTime - The minimum time in milliseconds to keep the loading state active.
 * @property {boolean} isLoading - Indicates if the loading state is active.
 * @property {(value: boolean) => void} setIsLoading - Function to set the loading state.
 */
export function useMinLoading(minLoadingTime: number) {
  const [loading, setLoading] = useState(false);
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLoadingWithTimer = useCallback(
    (value: boolean) => {
      setLoading(value);
      if (!value) return;

      setMinLoadingElapsed(false);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setMinLoadingElapsed(true);
        timerRef.current = null;
      }, minLoadingTime);
    },
    [minLoadingTime],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isLoading = loading || !minLoadingElapsed;

  return { isLoading, setIsLoading: setLoadingWithTimer };
}
