/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        lit: {
          primary: "#ff4458",
          "primary-hover": "#e63347",
          "primary-dark": "#cc2236",
          "primary-light": "#ffe4e8",
          "primary-50": "#fff5f7",
          blue: "#ff4458",
          "blue-600": "#e63347",
          "blue-700": "#cc2236",
          "blue-100": "#ffe4e8",
          "blue-50": "#fff5f7",
          black: "#0f172a",
          ink: "#1e293b",
          muted: "#64748b",
          line: "#e2e8f0",
          card: "#ffffff",
          flame: "#ff6536",
          coral: "#ff4b72",
        },
      },
      boxShadow: {
        card: "0 16px 36px -10px rgba(255, 68, 88, 0.16), 0 6px 16px -4px rgba(15, 23, 42, 0.05)",
        glow: "0 0 24px rgba(255, 68, 88, 0.35)",
        soft: "0 4px 20px -2px rgba(15, 23, 42, 0.06)",
        elevated: "0 10px 30px -5px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
