import { useEffect, useEffectEvent } from 'react';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';

interface UseKeyState {
  onKeyPress: () => void;
  keys: string[];
  disabledOnOverlayOpen?: boolean;
}

/**
 * Custom hook to handle key presses.
 *
 * @param onKeyPress Callback function to execute on key press.
 * @param keys Key(s) to listen for (string or array of strings).
 * @param disabledOnOverlayOpen If true, disables key listener when overlay is open.
 */
export function useKey({ onKeyPress, keys, disabledOnOverlayOpen = false }: UseKeyState) {
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);

  const stableOnKeyPress = useEffectEvent(onKeyPress);

  useEffect(() => {
    if (disabledOnOverlayOpen && isOverlayOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keys.includes(e.key)) {
        stableOnKeyPress();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, disabledOnOverlayOpen, isOverlayOpen]);
}
