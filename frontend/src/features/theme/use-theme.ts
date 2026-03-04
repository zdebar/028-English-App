import { create } from 'zustand';
import { clearUserTheme, loadUserTheme, saveUserTheme } from './theme-utils';
import { useEffect } from 'react';

export type UserTheme = 'light' | 'dark';
const DEFAULT_THEME_USER_ID = 'guest';

interface ThemeState {
  theme: UserTheme;
  loadTheme: (userId?: string) => void;
  clearTheme: (userId?: string) => void;
  chooseTheme: (newTheme: UserTheme, userId?: string) => void;
}

/**
 * Creates a theme store for managing application theme state and persistence.
 *
 * Handles theme selection, storage, and application across the DOM using Zustand.
 * Supports both light and dark themes with automatic system preference detection.
 */
export const useThemeStore = create<ThemeState>((set, get) => {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const resolveUserId = (userId?: string) => userId ?? DEFAULT_THEME_USER_ID;
  const isUserTheme = (value: string | null): value is UserTheme =>
    value === 'light' || value === 'dark';

  const getSystemTheme = (): UserTheme => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  };

  const readStoredTheme = (userId: string): UserTheme | null => {
    if (!isBrowser) return null;

    try {
      const stored = loadUserTheme(userId);
      return isUserTheme(stored) ? stored : null;
    } catch {
      return null;
    }
  };

  const applyTheme = (theme: UserTheme) => {
    if (!isBrowser) return;

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  };

  const saveTheme = (theme: UserTheme, userId: string) => {
    if (!isBrowser) return;

    try {
      saveUserTheme(theme, userId);
    } catch {
      // Ignore storage failures (e.g., blocked storage)
    }
  };

  const initialTheme: UserTheme = readStoredTheme(DEFAULT_THEME_USER_ID) ?? getSystemTheme();
  applyTheme(initialTheme);

  return {
    theme: initialTheme,
    loadTheme: (userId?: string) => {
      const resolvedUserId = resolveUserId(userId);
      const storedTheme = readStoredTheme(resolvedUserId) ?? getSystemTheme();
      applyTheme(storedTheme);
      set({ theme: storedTheme });
    },
    clearTheme: (userId?: string) => {
      const resolvedUserId = resolveUserId(userId);
      if (!isBrowser) return;
      try {
        clearUserTheme(resolvedUserId);
      } catch {
        // Ignore storage failures (e.g., blocked storage)
      }
      const fallbackTheme = getSystemTheme();
      applyTheme(fallbackTheme);
      set({ theme: fallbackTheme });
    },
    chooseTheme: (newTheme: UserTheme, userId?: string) => {
      const resolvedUserId = resolveUserId(userId);
      if (newTheme === get().theme) {
        applyTheme(newTheme);
        return;
      }
      applyTheme(newTheme);
      saveTheme(newTheme, resolvedUserId);
      set({ theme: newTheme });
    },
  };
});

/**
 * Custom hook to initialize and update theme when userId changes.
 * Usage: useThemeLoader(userId)
 */
export function useThemeLoader(userId?: string) {
  const loadTheme = useThemeStore((state) => state.loadTheme);
  useEffect(() => {
    loadTheme(userId);
  }, [userId, loadTheme]);
}
