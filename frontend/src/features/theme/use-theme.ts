import { create } from 'zustand';
import { loadUserTheme, saveUserTheme } from './theme-utils';

export type UserTheme = 'light' | 'dark';

interface ThemeState {
  theme: UserTheme;
  userId: string;
  setUserId: (userId: string) => void;
  clearTheme: () => void;
  chooseTheme: (newTheme: UserTheme) => void;
}

/**
 * A Zustand store hook for managing the application's theme state.
 *
 * This hook handles theme detection, persistence, and application:
 * - Detects the system's preferred color scheme (light or dark).
 * - Reads the stored theme from localStorage if available.
 * - Applies the theme by toggling CSS classes on the document root.
 * - Persists the chosen theme to localStorage only when user changes theme.
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

  const readStoredTheme = (userId: string): UserTheme | null => {
    if (!isBrowser) return null;
    userId = userId || 'guest';

    try {
      const stored = loadUserTheme(userId);
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
  };

  const saveTheme = (theme: UserTheme, userId: string) => {
    if (!isBrowser) return;
    userId = userId || 'guest';

    try {
      saveUserTheme(theme, userId);
    } catch {
      // Ignore storage failures (e.g., blocked storage)
    }
  };

  const initialUserId = 'guest';
  const initialTheme: UserTheme = readStoredTheme(initialUserId) ?? getSystemTheme();
  applyTheme(initialTheme);

  return {
    theme: initialTheme,
    userId: initialUserId,
    clearTheme: () => {
      const userId = get().userId || 'guest';
      if (!isBrowser) return;
      try {
        localStorage.removeItem(`theme_${userId}`);
      } catch {
        // Ignore storage failures (e.g., blocked storage)
      }
    },
    setUserId: (userId: string) => set({ userId }),
    chooseTheme: (newTheme: UserTheme) => {
      const userId = get().userId || 'guest';
      if (newTheme === get().theme) {
        applyTheme(newTheme);
        return;
      }
      applyTheme(newTheme);
      saveTheme(newTheme, userId);
      set({ theme: newTheme });
    },
  };
});
