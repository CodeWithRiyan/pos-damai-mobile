/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./providers/**/*.{js,jsx,ts,tsx}",
    "./stores/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}"
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
          800: "#991b1b",
        },
        success: {
          700: "#15803d",
        },
        warning: {
          700: "#c2410c",
        },
        info: {
          700: "#1d4ed8",
        },
        typography: {
          0: "#ffffff",
          50: "#f9fafb",
          900: "#111827",
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
      },
      boxShadow: {
        "hard-5": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
