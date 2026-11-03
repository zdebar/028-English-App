export const DEFAULT_THEME_USER_ID = 'guest';

const ACTIVE_THEME_STORAGE_KEY = 'theme_active';

export type ThemePreference = 'light' | 'dark';

/**
 * Saves the user's theme preference to local storage.
 * @param theme Theme to save.
 * @param userId Unique user id; omitted for the guest preference.
 */
export function saveUserTheme(theme: ThemePreference, userId?: string | null): void {
  localStorage.setItem(getThemeStorageKey(userId), theme);
}

/**
 * Loads a valid theme preference from local storage.
 * @param userId Unique user id; omitted for the guest preference.
 * @returns The saved theme or null when none is stored or the value is invalid.
 */
export function loadUserTheme(userId?: string | null): ThemePreference | null {
  const theme = localStorage.getItem(getThemeStorageKey(userId));
  return theme === 'light' || theme === 'dark' ? theme : null;
}

/** Saves the theme used during the next pre-paint bootstrap. */
export function saveActiveTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(ACTIVE_THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore unavailable or blocked storage.
  }
}

/** Loads and validates the theme used during the pre-paint bootstrap. */
export function loadActiveTheme(): ThemePreference | null {
  try {
    const theme = localStorage.getItem(ACTIVE_THEME_STORAGE_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null;
  }
}

/** Clears the cached pre-paint theme so the system preference is used. */
export function clearActiveTheme(): void {
  try {
    localStorage.removeItem(ACTIVE_THEME_STORAGE_KEY);
  } catch {
    // Ignore unavailable or blocked storage.
  }
}

function getThemeStorageKey(userId?: string | null): string {
  return `theme_${userId ?? DEFAULT_THEME_USER_ID}`;
}
