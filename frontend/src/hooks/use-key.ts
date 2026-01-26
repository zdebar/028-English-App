import { useEffect, useCallback, useMemo } from 'react';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';

interface UseKeyState {
  onKeyPress: () => void;
  keys: string | string[];
  disabledOnOverlayOpen?: boolean;
}

/**
 * Custom hook to handle key presses.
 * @param onKeyPress Callback function to execute on key press.
 * @param keys Key(s) to listen for (string or array of strings). Defaults to ['Escape'].
 * @param disabledOnOverlayOpen If true, disables key listener when overlay is open.
 */
export function useKey({ onKeyPress, keys, disabledOnOverlayOpen = false }: UseKeyState) {
  const keyArray = useMemo(() => (Array.isArray(keys) ? keys : [keys]), [keys]);
  const isOverlayOpen = useOverlayStore((state) => state.isOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (keyArray.includes(e.key)) {
        e.preventDefault();
        onKeyPress();
      }
    },
    [onKeyPress, keyArray],
  );

  useEffect(() => {
    if (disabledOnOverlayOpen && isOverlayOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabledOnOverlayOpen, isOverlayOpen]);
}
