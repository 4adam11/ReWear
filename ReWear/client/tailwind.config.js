/** @type {import('tailwindcss').Config} */

// ReWear palette: earthy tones for sustainable, second-hand fashion.
// The pages use indigo/purple/pink class names everywhere (e.g. the brand
// gradient "from-indigo-500 via-purple-500 to-pink-500"), so those three
// scales are remapped here instead of rewriting every component:
//   indigo -> forest green (brand), purple -> sage/olive, pink -> terracotta
export default {
  content: [
    "./index.html", "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: "#eef6f1",
          100: "#d6eadd",
          200: "#aed5bd",
          300: "#7fba98",
          400: "#4f9a73",
          500: "#2f7d5b",
          600: "#24664a",
          700: "#1d523c",
          800: "#183f2f",
          900: "#123026",
          950: "#0a1d16",
        },
        purple: {
          50: "#f3f6ef",
          100: "#e2ebdb",
          200: "#c6d7b9",
          300: "#a5bf92",
          400: "#86a46f",
          500: "#6a8a55",
          600: "#536d42",
          700: "#425635",
          800: "#36462d",
          900: "#2d3b26",
          950: "#172013",
        },
        pink: {
          50: "#fdf4ef",
          100: "#fae4d8",
          200: "#f4c6af",
          300: "#eca07f",
          400: "#e27b53",
          500: "#d4623a",
          600: "#bb4e2b",
          700: "#9b3f24",
          800: "#7e3522",
          900: "#682e1f",
          950: "#38150d",
        },
        // Named tokens for the colours the pages hard-code
        ink: "#1f3a2e",
        paper: "#f6f5f0",
      },
    },
  },
  plugins: [],
}
