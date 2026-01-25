import { useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook to handle key presses.
 * @param onKeyPress Callback function to execute on key press.
 * @param keys Key(s) to listen for (string or array of strings). Defaults to ['Escape'].
 */
export function useKey(onKeyPress: () => void, keys: string | string[]) {
  const keyArray = useMemo(() => (Array.isArray(keys) ? keys : [keys]), [keys]);

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
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
