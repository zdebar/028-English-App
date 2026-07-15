import { useEffect } from 'react';
import { useThemeStore } from './use-theme-store';

/**
 * Custom hook to initialize and update theme when userId changes.
 *
 * @param userId The current user ID (optional)
 * @param authLoading Whether authentication is still resolving the current user
 */
export function useThemeLoader(userId: string | null | undefined, authLoading: boolean) {
  const loadTheme = useThemeStore((state) => state.loadTheme);

  useEffect(() => {
    if (authLoading) return;
    loadTheme(userId);
  }, [userId, authLoading, loadTheme]);
}
