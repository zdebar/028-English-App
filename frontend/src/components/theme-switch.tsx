import { SunIcon, MoonIcon } from "./icons.js";
import Button from "./button.js";
import { useThemeStore } from "../hooks/use-theme";

export default function ThemeSwitch() {
  const { theme, chooseTheme } = useThemeStore();

  const handleChange = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    chooseTheme(nextTheme);
  };
  return (
    <Button
      buttonType="button-header"
      aria-label="Nastavení pozadí"
      buttonColor="color-header"
      onClick={handleChange}
      title={theme}
    >
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
