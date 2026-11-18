import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        muted: "#71807b",
        canvas: "#f5f7f5",
        line: "#e7ece8",
        brand: {
          DEFAULT: "#167d68",
          dark: "#106451",
          soft: "#e6f4ef"
        }
      },
      boxShadow: {
        card: "0 8px 30px rgba(20, 45, 35, 0.05)"
      }
    }
  },
  plugins: []
};

export default config;