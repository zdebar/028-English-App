import SunIcon from '@/components/UI/icons/SunIcon';
import MoonIcon from '@/components/UI/icons/MoonIcon';
import { useThemeStore } from '@/features/theme/use-theme-store';
import { ARIA_TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useAuthStore } from '../auth/use-auth-store';

/**
 * A button that toggles between light and dark themes. Default is system preference.
 * @returns The rendered theme switch button.
 */
export default function ThemeSwitch(): JSX.Element {
  const theme = useThemeStore((state) => state.theme);
  const chooseTheme = useThemeStore((state) => state.chooseTheme);
  const userId = useAuthStore((state) => state.userId);

  const themeLabel =
    theme === 'light' ? ARIA_TEXTS.switchToDarkTheme : ARIA_TEXTS.switchToLightTheme;

  return (
    <button
      type="button"
      aria-label={themeLabel}
      onClick={() => chooseTheme(theme === 'light' ? 'dark' : 'light', userId)}
      className="size-button hover:bg-button-hover hover:text-light focus-visible:bg-button-hover focus-visible:text-light flex shrink-0 grow-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none"
      title={themeLabel}
    >
      {theme === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
