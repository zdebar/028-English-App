import SunIcon from '@/components/UI/icons/SunIcon';
import MoonIcon from '@/components/UI/icons/MoonIcon';
import { useThemeStore, type UserTheme } from '@/features/theme/use-theme';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useAuthStore } from '../auth/use-auth-store';
import { useEffect } from 'react';

/**
 * A button that toggles between light and dark themes. Default is system preference.
 * @returns The rendered theme switch button.
 */
export default function ThemeSwitch(): JSX.Element {
  const theme = useThemeStore((state) => state.theme);
  const chooseTheme = useThemeStore((state) => state.chooseTheme);
  const setUserId = useThemeStore((state) => state.setUserId);
  const userId = useAuthStore((state) => state.userId);

  useEffect(() => {
    if (userId) {
      setUserId(userId);
    }
  }, [userId, setUserId]);

  const handleChange = () => {
    const nextTheme: UserTheme = theme === 'light' ? 'dark' : 'light';
    chooseTheme(nextTheme);
  };

  const themeLabel = theme === 'light' ? TEXTS.themeLight : TEXTS.themeDark;

  return (
    <button
      aria-label={themeLabel}
      onClick={handleChange}
      className="button-round"
      title={themeLabel}
    >
      {theme === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
