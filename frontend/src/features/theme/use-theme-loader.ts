import { useEffect } from 'react';
import { useThemeStore } from './use-theme-store';

/**
 * Custom hook to initialize and update theme when userId changes.
 *
 * @param userId The current user ID (optional)
 */
export function useThemeLoader(userId?: string | null) {
  const loadTheme = useThemeStore((state) => state.loadTheme);

  useEffect(() => {
    loadTheme(userId);
  }, [userId, loadTheme]);
}
