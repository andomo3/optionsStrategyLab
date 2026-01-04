import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#111827",
          700: "#374151",
          500: "#6B7280",
        },
        sand: {
          50: "#FAF7F2",
          100: "#F5EFE6",
          200: "#E9DEC9",
        },
        mint: {
          500: "#3DC6B6",
          600: "#2AA999",
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
      },
      borderRadius: {
        xl: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
