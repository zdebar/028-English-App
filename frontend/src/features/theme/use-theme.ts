import { create } from 'zustand';

export type UserTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

interface ThemeState {
  theme: UserTheme;
  chooseTheme: (newTheme: UserTheme) => void;
}

/**
 * A Zustand store hook for managing the application's theme state.
 *
 * This hook handles theme detection, persistence, and application:
 * - Detects the system's preferred color scheme (light or dark).
 * - Reads the stored theme from localStorage if available.
 * - Applies the theme by toggling CSS classes on the document root.
 * - Persists the chosen theme to localStorage.
 *
 * The store is initialized with the stored theme or system theme on first use.
 *
 * @returns An object with the following properties:
 * - `theme`: The current theme ('light' or 'dark').
 * - `chooseTheme`: A function to set a new theme ('light' or 'dark')
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
