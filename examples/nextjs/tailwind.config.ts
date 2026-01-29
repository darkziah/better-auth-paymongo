import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        orange: {
          600: "#f97316",
          700: "#ea580c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
