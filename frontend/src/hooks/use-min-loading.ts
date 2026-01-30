import { useState, useRef, useEffect, useCallback } from 'react';

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
