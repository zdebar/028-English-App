import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Keeps React state synchronized with one localStorage key.
 *
 * @param key localStorage key to read from and write to. When the key changes, state is reloaded
 * from the new key and the first save is skipped.
 * @param initialValue Value used when the current key has no stored JSON value.
 * @returns A React state tuple. Values are stored as JSON on every state change after initialization.
 * @throws SyntaxError when an existing localStorage value is not valid JSON.
 */
export function useLocalStorageSync<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const storedValue = localStorage.getItem(key);
  const initial = storedValue ? (JSON.parse(storedValue) as T) : initialValue;

  const [value, setValue] = useState<T>(initial);
  const previousKey = useRef(key);
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (previousKey.current === key) {
      return;
    }

    previousKey.current = key;
    skipNextSave.current = true;

    const nextStoredValue = localStorage.getItem(key);
    setValue(nextStoredValue ? (JSON.parse(nextStoredValue) as T) : initialValue);
  }, [initialValue, key]);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
