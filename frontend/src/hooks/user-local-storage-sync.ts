import { useState, useEffect } from 'react';

/**
 * Custom hook to sync a state value with localStorage.
 * Loads from localStorage on mount and saves on every change.
 * @param key The localStorage key
 * @param initialValue The initial value to use if localStorage is empty
 * @returns A tuple containing the state value and a setter function
 */
export function useLocalStorageSync<T extends string>(
  key: string,
  initialValue: T,
): [T, (newValue: T) => void] {
  const storedValue = localStorage.getItem(key);
  const initial = storedValue ? JSON.parse(storedValue) : initialValue;

  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
