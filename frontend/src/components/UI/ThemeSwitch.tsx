import SunIcon from "@/components/UI/icons/SunIcon";
import MoonIcon from "@/components/UI/icons/MoonIcon";
import { useThemeStore, type UserTheme } from "@/hooks/use-theme";

/**
 * ThemeSwitch Component
 * A button that toggles between light and dark themes. Default is system preference.
 */
export default function ThemeSwitch() {
  const { theme, chooseTheme } = useThemeStore();

  const handleChange = () => {
    const nextTheme: UserTheme = theme === "light" ? "dark" : "light";
    chooseTheme(nextTheme);
  };

  const keys = {
    dark: "Přepnout na světlý režim",
    light: "Přepnout na tmavý režim",
  };

  return (
    <button
      aria-label={theme === "light" ? keys.dark : keys.light}
      onClick={handleChange}
      className="shape-button-header hover:bg-inherit hover:text-inherit"
      title={theme === "light" ? keys.light : keys.dark}
    >
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
