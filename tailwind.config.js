/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        panel: "var(--panel)",
        muted: "var(--muted)",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,.14)",
      }
    },
  },
  plugins: [],
};
