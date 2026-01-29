import SunIcon from '@/components/UI/icons/SunIcon';
import MoonIcon from '@/components/UI/icons/MoonIcon';
import { useThemeStore, type UserTheme } from '@/features/theme/use-theme';
import { TEXTS } from '@/config/texts';

/**
 * A button that toggles between light and dark themes. Default is system preference.
 */
export default function ThemeSwitch() {
  const theme = useThemeStore((state) => state.theme);
  const chooseTheme = useThemeStore((state) => state.chooseTheme);

  const handleChange = () => {
    const nextTheme: UserTheme = theme === 'light' ? 'dark' : 'light';
    chooseTheme(nextTheme);
  };

  const themeLabel = theme === 'light' ? TEXTS.themeLight : TEXTS.themeDark;

  return (
    <button
      aria-label={themeLabel}
      onClick={handleChange}
      className="button-round hover:bg-inherit hover:text-inherit"
      title={themeLabel}
    >
      {theme === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
