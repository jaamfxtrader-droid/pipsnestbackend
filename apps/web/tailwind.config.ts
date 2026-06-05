import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        profit: "#22C55E",
        warning: "#F59E0B",
        loss: "#EF4444",
        ink: "#0F172A",
        paper: "#F8FAFC"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(15, 23, 42, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
