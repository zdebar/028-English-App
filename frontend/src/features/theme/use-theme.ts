import { create } from 'zustand';

export type UserTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

interface ThemeState {
  theme: UserTheme;
  chooseTheme: (newTheme: UserTheme) => void;
}

/**
 * Zustand store to manage user theme preferences.
 */
export const useThemeStore = create<ThemeState>((set, get) => {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

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

  const readStoredTheme = (): UserTheme | null => {
    if (!isBrowser) return null;
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  };

  const applyTheme = (theme: UserTheme) => {
    if (!isBrowser) return;

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures (e.g., blocked storage)
    }
  };

  const initialTheme: UserTheme = readStoredTheme() ?? getSystemTheme();
  applyTheme(initialTheme);

  return {
    theme: initialTheme,
    chooseTheme: (newTheme) => {
      if (newTheme === get().theme) {
        applyTheme(newTheme);
        return;
      }
      applyTheme(newTheme);
      set({ theme: newTheme });
    },
  };
});
