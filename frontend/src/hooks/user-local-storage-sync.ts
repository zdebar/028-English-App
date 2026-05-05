import { useEffect } from 'react';

/**
 * Custom hook to sync a state value with localStorage.
 * Loads from localStorage on mount and saves on every change.
 * @param key The localStorage key
 * @param value The value to save
 * @param setter The setter function to update the state
 */
export function useLocalStorageSync(key: string, value: string, setter: (v: string) => void) {
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null && saved !== value) {
      setter(saved);
    }
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);
}
