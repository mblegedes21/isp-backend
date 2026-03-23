import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "app-bg": "rgb(var(--color-bg) / <alpha-value>)",
        "app-card": "rgb(var(--color-card) / <alpha-value>)",
        "app-text": "rgb(var(--color-text) / <alpha-value>)",
        "app-border": "rgb(var(--color-border) / <alpha-value>)",
        surface: "rgb(var(--color-bg) / <alpha-value>)",
        panel: "rgb(var(--color-card) / <alpha-value>)",
        ink: "rgb(var(--color-text) / <alpha-value>)",
        accent: "rgb(var(--color-primary) / <alpha-value>)",
        danger: "#b91c1c",
        warning: "#b45309",
        success: "#15803d",
        info: "#1d4ed8"
      }
    }
  },
  plugins: []
};

export default config;
