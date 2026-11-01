import { useEffect, useEffectEvent } from 'react';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { assertFunction, assertNonEmptyArray } from '@/utils/assertions.utils';

type UseKeyOptions = Readonly<{
  onKeyPress: () => void;
  keys: readonly string[];
  disabledOnOverlayOpen?: boolean;
}>;

/**
 * Registers a global keydown listener for one or more KeyboardEvent.key values.
 *
 * @param onKeyPress Callback invoked when one of the configured keys is pressed.
 * @param keys Non-empty list of KeyboardEvent.key values, such as Enter or Escape.
 * @param disabledOnOverlayOpen When true, skips listener registration while the overlay store is open.
 * Defaults to false.
 * @throws TypeError when onKeyPress is not a function.
 * @throws Error when keys is empty or not an array.
 */
export function useKey({ onKeyPress, keys, disabledOnOverlayOpen = false }: UseKeyOptions) {
  assertFunction(onKeyPress, 'onKeyPress');
  assertNonEmptyArray(keys, 'keys');

  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);
  const isDisabled = disabledOnOverlayOpen && isOverlayOpen;

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (!keys.includes(e.key)) return;
    onKeyPress();
  });

  useEffect(() => {
    if (isDisabled) return;

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isDisabled]);
}
