import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ledger: {
          paper: "#FAF6EC",
          line: "#E4DCC6",
          ink: "#1F2419",
        },
        cavite: {
          blue: "#163A7B",
          bluedeep: "#0E2957",
          gold: "#EFB621",
          red: "#C23B34",
          sage: "#4C7A4E",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "ledger-grid":
          "linear-gradient(rgba(31,36,25,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(31,36,25,0.045) 1px, transparent 1px)",
      },
      backgroundSize: {
        ledger: "28px 28px",
      },
      boxShadow: {
        stamp: "0 1px 0 rgba(31,36,25,0.06), 0 8px 24px -12px rgba(14,41,87,0.25)",
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
