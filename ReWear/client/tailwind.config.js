/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";

// ReWear palette: warm "coffee" tones (espresso, mocha, caramel on cream).
// The pages use indigo/purple/pink class names everywhere (e.g. the brand
// gradient "from-indigo-500 via-purple-500 to-pink-500"), so those scales
// are remapped here instead of rewriting every component:
//   indigo -> espresso (brand), purple -> mocha, pink -> caramel,
//   gray -> warm stone greys (so borders and muted text look creamy)
export default {
  content: [
    "./index.html", "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: "#f8f3ee",
          100: "#efe3d8",
          200: "#dfc6b1",
          300: "#c9a184",
          400: "#a8785a",
          500: "#6b4430",
          600: "#5a3826",
          700: "#4a2e20",
          800: "#3b251a",
          900: "#2f1e15",
          950: "#1c110b",
        },
        purple: {
          50: "#f9f4ef",
          100: "#f1e5d9",
          200: "#e3cab3",
          300: "#d0a988",
          400: "#b7865f",
          500: "#8b5e3c",
          600: "#774f32",
          700: "#60402a",
          800: "#4e3524",
          900: "#412c1f",
          950: "#24170f",
        },
        pink: {
          50: "#fdf7f0",
          100: "#f9ead9",
          200: "#f2d3b0",
          300: "#e7b582",
          400: "#d99a5e",
          500: "#c0834f",
          600: "#a76b3d",
          700: "#8a5533",
          800: "#70452c",
          900: "#5c3a26",
          950: "#321d12",
        },
        gray: colors.stone,
        // Named tokens for the colours the pages hard-code
        ink: "#2b1d14",
        paper: "#faf6ef",
        line: "#e7ddd0",
        muted: "#6e5d50",
        cream: "#f6efe5",
        brand: { DEFAULT: "#6b4430", dark: "#4a2e20" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
}
