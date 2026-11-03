import { useEffect, useEffectEvent } from 'react';
import { assertFunction, assertNonEmptyArray } from '@/utils/assertions.utils';

type UseKeyOptions = Readonly<{
  onKeyPress: () => void;
  keys: readonly string[];
  enabled?: boolean;
}>;

/**
 * Registers a global keydown listener for one or more KeyboardEvent.key values.
 *
 * @param onKeyPress Callback invoked when one of the configured keys is pressed.
 * @param keys Non-empty list of KeyboardEvent.key values, such as Enter or Escape.
 * @param enabled When false, skips listener registration. Defaults to true.
 * @throws TypeError when onKeyPress is not a function.
 * @throws Error when keys is empty or not an array.
 */
export function useKey({ onKeyPress, keys, enabled = true }: UseKeyOptions) {
  assertFunction(onKeyPress, 'onKeyPress');
  assertNonEmptyArray(keys, 'keys');

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (!keys.includes(e.key)) return;
    onKeyPress();
  });

  useEffect(() => {
    if (!enabled) return;

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
