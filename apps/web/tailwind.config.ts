import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201c",
        paper: "#f8f7f1",
        moss: "#53695a",
        coral: "#df725d",
      },
      gridTemplateColumns: {
        15: "repeat(15, minmax(0, 1fr))",
      },
      gridTemplateRows: {
        15: "repeat(15, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};

export default config;
