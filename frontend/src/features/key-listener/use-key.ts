import { useEffect, useEffectEvent } from 'react';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';

interface UseKeyState {
  onKeyPress: () => void;
  keys: readonly string[];
  disabledOnOverlayOpen?: boolean;
}

/**
 * A React hook that listens for specific key presses on the window and executes a callback when those keys are pressed.
 * It can optionally be disabled when an overlay is open, based on the `disabledOnOverlayOpen` flag.
 *
 * @param onKeyPress - The callback function to execute when a specified key is pressed.
 * @param keys - An array of key strings (e.g., ['Enter', 'Escape']) to listen for.
 * @param disabledOnOverlayOpen - If true, disables the key listener when an overlay is open. Defaults to false.
 */
export function useKey({ onKeyPress, keys, disabledOnOverlayOpen = false }: UseKeyState) {
  if (typeof onKeyPress !== 'function') {
    throw new Error('onKeyPress must be a function.');
  }
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('keys must be a non-empty array.');
  }

  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);
  const isDisabled = disabledOnOverlayOpen && isOverlayOpen;

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (!keys.includes(e.key)) return;
    onKeyPress();
  });

  useEffect(() => {
    if (isDisabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isDisabled]);
}
