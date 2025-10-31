import { SunIcon, MoonIcon } from "@/components/icons.js";
import { useThemeStore, type UserTheme } from "@/hooks/use-theme";

export default function ThemeSwitch() {
  const { theme, chooseTheme } = useThemeStore();

  const handleChange = () => {
    const nextTheme: UserTheme = theme === "light" ? "dark" : "light";
    chooseTheme(nextTheme);
  };

  return (
    <button
      aria-label="Nastavení pozadí"
      onClick={handleChange}
      className="button-header hover:bg-inherit hover:text-inherit"
      title={theme as UserTheme}
    >
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
