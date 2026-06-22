/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          50: "#fdf2f4",
          100: "#fbe5e9",
          200: "#f7ccd5",
          300: "#f1a5b4",
          400: "#e9748c",
          500: "#db4869",
          600: "#c72d51",
          700: "#a7203e",
          800: "#8b1d36",
          900: "#741c30",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
          50: "#f4f8f6",
          100: "#e3efea",
          200: "#c9dfd5",
          300: "#a1c5b6",
          400: "#73a592",
          500: "#558a77",
          600: "#416f5f",
          700: "#36594d",
          800: "#2d483f",
          900: "#263d36",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
    },
  },
  plugins: [],
}
