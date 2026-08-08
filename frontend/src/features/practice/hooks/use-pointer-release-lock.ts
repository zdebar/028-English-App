import { useCallback, useEffect, useRef, useState } from 'react';

type PointerReleaseLock = Readonly<{
  isLocked: boolean;
  lockUntilRelease: () => void;
}>;

export function usePointerReleaseLock(): PointerReleaseLock {
  const [isLocked, setIsLocked] = useState(false);
  const releaseHandlerRef = useRef<(() => void) | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReleaseListeners = useCallback(() => {
    const releaseHandler = releaseHandlerRef.current;
    if (!releaseHandler) {
      return;
    }

    globalThis.removeEventListener('pointerup', releaseHandler);
    globalThis.removeEventListener('pointercancel', releaseHandler);
    globalThis.removeEventListener('blur', releaseHandler);
    releaseHandlerRef.current = null;
  }, []);

  const clearUnlockTimer = useCallback(() => {
    if (unlockTimerRef.current === null) {
      return;
    }

    globalThis.clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = null;
  }, []);

  const unlockAfterRelease = useCallback(() => {
    clearReleaseListeners();
    clearUnlockTimer();

    unlockTimerRef.current = globalThis.setTimeout(() => {
      unlockTimerRef.current = null;
      setIsLocked(false);
    }, 0);
  }, [clearReleaseListeners, clearUnlockTimer]);

  const lockUntilRelease = useCallback(() => {
    clearReleaseListeners();
    clearUnlockTimer();
    setIsLocked(true);

    releaseHandlerRef.current = unlockAfterRelease;
    globalThis.addEventListener('pointerup', unlockAfterRelease);
    globalThis.addEventListener('pointercancel', unlockAfterRelease);
    globalThis.addEventListener('blur', unlockAfterRelease);
  }, [clearReleaseListeners, clearUnlockTimer, unlockAfterRelease]);

  useEffect(() => {
    return () => {
      clearReleaseListeners();
      clearUnlockTimer();
    };
  }, [clearReleaseListeners, clearUnlockTimer]);

  return { isLocked, lockUntilRelease };
}
