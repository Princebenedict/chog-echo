import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10081D",
        night: "#160D26",
        plum: "#1D1230",
        grape: "#211438",
        violet: { DEFAULT: "#8754F6", deep: "#5B2FC4" },
        electric: "#A46CFF",
        mint: "#55F0B0",
        bone: "#F6F0FF",
        lavender: "#B9A9D1",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
