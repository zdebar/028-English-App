import React from "react";
import Label from "./label";
import { useThemeStore } from "../hooks/use-theme";
import type { UserTheme } from "../types/data.types";

const themeOptions: { label: string; value: UserTheme }[] = [
  { label: "Světlý", value: "light" },
  { label: "Tmavý", value: "dark" },
  { label: "Systém", value: "system" },
];

export default function ThemeDropdown({ className }: { className?: string }) {
  const { theme, chooseTheme } = useThemeStore();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = event.target.value as UserTheme;
    chooseTheme(selectedTheme);
  };

  return (
    <div className={`row centered ${className}`}>
      <Label text="Vzhled:" />
      <select
        id="theme-select"
        value={theme}
        onChange={handleChange}
        className="color-disabled h-full w-full"
        aria-label="Změna motivu"
      >
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
