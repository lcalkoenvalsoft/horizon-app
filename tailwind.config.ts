import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0C0F14",
        surface: { DEFAULT: "#13171E", raised: "#1A1F28", hover: "#222833" },
        border: { DEFAULT: "#2A3040", focus: "#5B8DEF" },
        text: { primary: "#E8ECF4", secondary: "#A0AAC0", muted: "#5E6882" },
        accent: { DEFAULT: "#5B8DEF", soft: "rgba(91,141,239,0.12)" },
        green: { DEFAULT: "#7CCA98", soft: "rgba(124,202,152,0.12)" },
        red: { DEFAULT: "#E8927C", soft: "rgba(232,146,124,0.12)" },
        yellow: { DEFAULT: "#F0C75E" },
        category: {
          housing: "#E8927C",
          essentials: "#7CAABD",
          lifestyle: "#C09BD8",
          savings: "#7CCA98",
        },
        investment: {
          stocks: "#5B8DEF",
          bonds: "#E8927C",
          crypto: "#F0C75E",
          realestate: "#7CCA98",
          savings: "#C09BD8",
          other: "#7CAABD",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
