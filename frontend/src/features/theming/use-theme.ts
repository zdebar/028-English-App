import { create } from "zustand";

export type UserTheme = "light" | "dark";

interface ThemeState {
  theme: UserTheme;
  chooseTheme: (newTheme: UserTheme) => void;
}

/**
 * Zustand store to manage user theme preferences.
 */
export const useThemeStore = create<ThemeState>((set) => {
  const applyTheme = (theme: UserTheme) => {
    // Apply the theme to the document
    if (!document.documentElement.classList.contains(theme)) {
      document.documentElement.classList.add(theme);
      document.documentElement.classList.remove(
        theme === "dark" ? "light" : "dark"
      );
    }
    localStorage.setItem("theme", theme);
  };

  // Determine the default theme based on system settings
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const defaultTheme: UserTheme = prefersDark ? "dark" : "light";

  // Load the stored theme or fall back to the system's default
  const storedTheme =
    (localStorage.getItem("theme") as UserTheme) || defaultTheme;
  applyTheme(storedTheme);

  return {
    theme: storedTheme,
    chooseTheme: (newTheme) => {
      applyTheme(newTheme);
      set({ theme: newTheme });
    },
  };
});
