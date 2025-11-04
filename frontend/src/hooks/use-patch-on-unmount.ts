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
      console.log("Unmounting, saving progress:", updateArrayRef.current);
      if (updateArrayRef.current.length > 0) {
        patchRef.current(updateArrayRef.current);
      }
    };
  }, []);
}
