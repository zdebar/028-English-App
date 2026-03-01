import SunIcon from '@/components/UI/icons/SunIcon';
import MoonIcon from '@/components/UI/icons/MoonIcon';
import { useThemeStore, type UserTheme } from '@/features/theme/use-theme';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useCallback } from 'react';
import { useAuthStore } from '../auth/use-auth-store';

/**
 * A button that toggles between light and dark themes. Default is system preference.
 * @returns The rendered theme switch button.
 */
export default function ThemeSwitch(): JSX.Element {
  const theme = useThemeStore((state) => state.theme);
  const chooseTheme = useThemeStore((state) => state.chooseTheme);
  const userId = useAuthStore((state) => state.userId);

  const handleChange = useCallback(() => {
    const nextTheme: UserTheme = theme === 'light' ? 'dark' : 'light';
    chooseTheme(nextTheme, userId ?? undefined);
  }, [chooseTheme, theme, userId]);

  const themeLabel = theme === 'light' ? TEXTS.themeLight : TEXTS.themeDark;

  return (
    <button
      aria-label={themeLabel}
      onClick={handleChange}
      className="size-button flex items-center justify-center rounded-full"
      title={themeLabel}
    >
      {theme === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
