import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1c1c1e",
        accentGold: "#c9a86e",
        textLight: "#FFFFFF",
      },
    },
  },
  plugins: [],
};

export default config;
