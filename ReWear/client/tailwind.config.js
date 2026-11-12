/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";

// ReWear brand tokens. DESIGN.md at the repo root explains each one and when to use it,
// and /brand on the site shows them. Use these names in class lists, never raw hex values.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // hover: styles only apply on devices that can hover, so taps on phones don't leave
  // buttons stuck in their hover state
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        gray: colors.stone,

        // Core
        ink: { DEFAULT: "#2b1d14", soft: "#4a3a2e" }, // text, primary buttons
        brand: { DEFAULT: "#6b4430", dark: "#4a2e20" }, // Espresso: links, focus, logo
        caramel: "#c0834f", // stars, rental highlights, chart fills (not for small text)
        gold: "#e8c39e", // highlights on dark surfaces, counters
        accent: "#a0521d", // small warm labels such as "New"

        // Surfaces
        paper: "#faf6ef", // page background
        cream: "#f6efe5", // hover rows, quiet fills
        sand: "#f1e8db", // alternate sections, avatars
        night: { DEFAULT: "#3b2a1f", soft: "#4a3426" }, // dark bands and image placeholders on dark
        ondark: { DEFAULT: "#e3d5c4", muted: "#bfae9c" }, // text on ink and night

        // Lines and secondary text
        line: { DEFAULT: "#e7ddd0", strong: "#d9cbb9", soft: "#efe6da" },
        field: "#9c8a78", // form field borders (3:1 against white)
        muted: "#6e5d50", // secondary text
        faint: "#7f6e60", // placeholders and fine print (still 4.5:1)

        // Status, named after Indian dyes: sage, neel (indigo), haldi (turmeric), sindoor
        success: { DEFAULT: "#3f6b4a", strong: "#2f5a3a", tint: "#eef4ef", wash: "#dfeae1", line: "#bcd3c0", ondark: "#9fd0aa" },
        info: { DEFAULT: "#2f6a8a", strong: "#245670", tint: "#eaf2f6", wash: "#d9e8f0", line: "#bdd5e2" },
        warning: { DEFAULT: "#8a5210", strong: "#7a480e", tint: "#fbf1e2", wash: "#f6e3c6", line: "#ecd3a8" },
        danger: { DEFAULT: "#a1352b", strong: "#8c2c23", tint: "#fbeceb", wash: "#f6d9d6", line: "#f0c4bf", ondark: "#f3a59c" },
      },
      // Shadows show depth (menus, hover lift); borders show structure (tables, inputs)
      boxShadow: {
        card: "0 1px 2px rgba(43, 29, 20, 0.06)",
        lift: "0 14px 30px -14px rgba(43, 29, 20, 0.35)",
        menu: "0 0 0 1px rgba(43, 29, 20, 0.06), 0 12px 32px -12px rgba(43, 29, 20, 0.3)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        // Geometric display face for headings, labels and buttons
        display: ["Jost", "Inter", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        // ease-out for state changes, per DESIGN.md "Motion"
        out: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};
