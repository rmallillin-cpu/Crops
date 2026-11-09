import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ledger: {
          paper: "#F8F9FC",
          line: "#E7E9F0",
          ink: "#1B2030",
        },
        cavite: {
          blue: "#1D4ED8",
          bluedeep: "#172E7C",
          gold: "#F59E0B",
          red: "#DC2626",
          sage: "#16A34A",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "ledger-grid":
          "radial-gradient(circle at 0% 0%, rgba(29,78,216,0.06), transparent 45%), radial-gradient(circle at 100% 0%, rgba(245,158,11,0.05), transparent 40%)",
      },
      backgroundSize: {
        ledger: "auto",
      },
      boxShadow: {
        stamp: "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -12px rgba(23,46,124,0.18)",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "check-pop": {
          "0%": { transform: "scale(0.6)" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.5s ease-out both",
        "check-pop": "check-pop 0.22s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
