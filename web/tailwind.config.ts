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
      keyframes: {
        pulseScale: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "pulse-scale": "pulseScale 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
