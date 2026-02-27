const DEFAULT_THEME_USER_ID = 'guest';

function resolveThemeUserId(userId?: string): string {
  return userId || DEFAULT_THEME_USER_ID;
}

/**
 * Generates a storage key for user theme preferences.
 * @param userId - The unique identifier of the user
 * @returns A formatted storage key string for storing the user's theme preference
 */
function getThemeStorageKey(userId?: string): string {
  return `theme_${resolveThemeUserId(userId)}`;
}

/**
 * Saves the user's theme preference to local storage.
 * @param theme - The theme to save (e.g., 'light', 'dark').
 * @param userId - The unique identifier of the user.
 */
export function saveUserTheme(theme: string, userId?: string): void {
  localStorage.setItem(getThemeStorageKey(userId), theme);
}

/**
 * Loads the theme preference for a specific user from local storage.
 * @param userId - The unique identifier of the user whose theme preference should be loaded.
 * @returns The stored theme preference as a string, or null if no theme preference has been saved for the user.
 */
export function loadUserTheme(userId?: string): string | null {
  return localStorage.getItem(getThemeStorageKey(userId));
}

/**
 * Clears the theme preference for a specific user from local storage.
 * @param userId - The unique identifier of the user whose theme preference should be cleared.
 */
export function clearUserTheme(userId?: string): void {
  localStorage.removeItem(getThemeStorageKey(userId));
}
