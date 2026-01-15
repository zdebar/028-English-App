import SunIcon from '@/components/UI/icons/SunIcon';
import MoonIcon from '@/components/UI/icons/MoonIcon';
import { useThemeStore, type UserTheme } from '@/features/theme/use-theme';
import { TEXTS } from '@/config/texts';

/**
 * A button that toggles between light and dark themes. Default is system preference.
 */
export default function ThemeSwitch() {
  const { theme, chooseTheme } = useThemeStore();

  const handleChange = () => {
    const nextTheme: UserTheme = theme === 'light' ? 'dark' : 'light';
    chooseTheme(nextTheme);
  };

  const themeLabels = {
    dark: TEXTS.themeDark,
    light: TEXTS.themeLight,
  };

  return (
    <button
      aria-label={theme === 'light' ? themeLabels.light : themeLabels.dark}
      onClick={handleChange}
      className="button-header hover:bg-inherit hover:text-inherit"
      title={theme === 'light' ? themeLabels.light : themeLabels.dark}
    >
      {theme === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
