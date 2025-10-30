// tailwind.config.ts
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  theme: {
    extend: {
      spacing: {
        ...defaultTheme.spacing,
        // Map Tailwind's utilities to your CSS variables
        "1": "var(--space-1)",
        "2": "var(--space-2)",
        "3": "var(--space-3)",
        "4": "var(--space-4)",
        "5": "var(--space-5)",
        "6": "var(--space-6)",
      },
    },
  },
};
