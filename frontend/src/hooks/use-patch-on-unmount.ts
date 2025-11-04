import { useEffect, useRef } from "react";

export function useSaveOnUnmount(
  patchFn: (newProgress: number[]) => Promise<void>,
  updatedProgress: number[]
) {
  const patchRef = useRef(patchFn);
  const updateArrayRef = useRef(updatedProgress);

  useEffect(() => {
    patchRef.current = patchFn;
  }, [patchFn]);

  useEffect(() => {
    updateArrayRef.current = updatedProgress;
  }, [updatedProgress]);

  useEffect(() => {
    return () => {
      patchRef.current(updateArrayRef.current);
    };
  }, []);
}
