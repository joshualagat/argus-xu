/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: "#030304",
        surface: "#0F1115",
        foreground: "#FFFFFF",
        primary: "#F7931A", // Bitcoin Orange
        secondary: "#EA580C",
        accent: "#FFD600",
      }
    },
  },
  plugins: [],
};
