import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Custom hook to sync a state value with localStorage.
 * Loads from localStorage on mount and saves on every change.
 * @param key The localStorage key
 * @param initialValue The initial value to use if localStorage is empty
 * @returns A tuple containing the state value and a setter function
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
