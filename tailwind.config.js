/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./providers/**/*.{js,jsx,ts,tsx}",
    "./stores/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#3D2117", // Dark Brown
          secondary: "#C2956A", // Tan
          accent: "#FDFBF9", // Warm White
          "primary-forground": "#FDFBF9", // Warm White,
          "secondary-forground": "#3D2117", // Dark Brown
          "accent-forground": "#3D2117", // Dark Brown
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        warning: {
          50: "#fefce8",
          100: "#fff3cd",
          200: "#feebc8",
          300: "#fde68a",
          400: "#fcd34d",
          500: "#f59e0b",
          600: "#d97706",
          700: "#c2410c",
        },
        info: {
          50: "#eff6ff",
          100: "#c7d2fe",
          200: "#a5b4fc",
          300: "#818cf8",
          400: "#6366f1",
          500: "#4f46e5",
          600: "#4338ca",
          700: "#1d4ed8",
        },
        typography: {
          0: "#ffffff",
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
        outline: {
          100: "#e5e7eb",
        },
        background: {
          0: "#ffffff",
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
        primary: {
          50: "#faf8f7",
          100: "#f5f0ed",
          200: "#e8ddd6",
          300: "#d4c1b4",
          400: "#b89a85",
          500: "#3d2117",
          600: "#331b13",
          700: "#29160f",
          800: "#1f100b",
          900: "#150b07",
        },
      },
      boxShadow: {
        "hard-5":
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
      },
      letterSpacing: {
        md: "0.025em",
      },
    },
  },
  plugins: [],
};
