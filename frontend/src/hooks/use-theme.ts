import { create } from "zustand";
import type { UserTheme } from "../types/data.types";

interface ThemeState {
  theme: UserTheme;
  chooseTheme: (newTheme: UserTheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const applyTheme = (theme: UserTheme) => {
    const updateSystemTheme = () => {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      document.documentElement.classList.toggle("light", !prefersDark);
    };

    // Cleanup function to remove event listeners
    const cleanupSystemThemeListener = () => {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.removeEventListener("change", updateSystemTheme);
    };

    if (theme === "system") {
      localStorage.removeItem("theme");
      updateSystemTheme();
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateSystemTheme);

      // Return cleanup function for "system" theme
      return cleanupSystemThemeListener;
    } else {
      // Avoid redundant class additions/removals
      if (!document.documentElement.classList.contains(theme)) {
        document.documentElement.classList.add(theme);
        document.documentElement.classList.remove(
          theme === "dark" ? "light" : "dark"
        );
      }
      localStorage.setItem("theme", theme);

      // Cleanup any leftover "system" theme listeners
      cleanupSystemThemeListener();
    }
  };

  const storedTheme = (localStorage.getItem("theme") as UserTheme) || "system";
  applyTheme(storedTheme);

  return {
    theme: storedTheme,
    chooseTheme: (newTheme) => {
      const cleanup = applyTheme(newTheme);
      set({ theme: newTheme });

      // If a cleanup function is returned (for "system"), call it when switching themes
      if (cleanup) {
        cleanup();
      }
    },
  };
});
