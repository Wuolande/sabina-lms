import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",

        brand: {
          50:  "#eef1fc",
          100: "#d9e0f9",
          200: "#b6c5f4",
          300: "#86a0ed",
          400: "#5075e3",
          500: "#2a4ed6",
          600: "#1b38be",
          700: "#14209C", // Primary Brand
          800: "#13217e",
          900: "#131f67",
          950: "#0b123e",
          DEFAULT: "#14209C",
        },
        accent: {
          50:  "#fefde8",
          100: "#fefbc2",
          200: "#fef489",
          300: "#fee844",
          400: "#F9C31C", // Accent
          500: "#e9a706",
          600: "#c77f02",
          700: "#9f5906",
          800: "#82460d",
          900: "#6e3a10",
          DEFAULT: "#F9C31C",
          foreground: "#111827",
        },
        primary: {
          DEFAULT:    "#14209C",
          foreground: "#ffffff",
          50:  "#eef1fc",
          100: "#d9e0f9",
          600: "#1b38be",
          700: "#14209C",
          800: "#13217e",
          900: "#131f67",
        },
        secondary: {
          DEFAULT:    "#F9C31C",
          foreground: "#0f172a",
        },
        destructive: {
          DEFAULT:    "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT:    "#f1f5f9",
          foreground: "#64748b",
        },
        popover: {
          DEFAULT:    "#ffffff",
          foreground: "#0f172a",
        },
        card: {
          DEFAULT:    "#ffffff",
          foreground: "#0f172a",
        },
      },

      borderRadius: {
        "4xl": "2rem",
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl:    "0.75rem",
        lg:    "var(--radius)",
        md:    "calc(var(--radius) - 2px)",
        sm:    "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans:    ["var(--font-sans)",    "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },

      letterSpacing: {
        widest: ".16em",
      },

      boxShadow: {
        xs:        "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        subtle:    "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        card:      "0 4px 6px -1px rgb(20 32 156 / 0.05), 0 2px 4px -2px rgb(20 32 156 / 0.03)",
        elevation: "0 12px 24px -6px rgb(20 32 156 / 0.1), 0 4px 8px -4px rgb(20 32 156 / 0.05)",
        "elevation-lg": "0 24px 48px -12px rgb(20 32 156 / 0.14), 0 8px 16px -8px rgb(20 32 156 / 0.06)",
        glow:      "0 0 24px -4px rgb(249 195 28 / 0.45)",
        "glow-emerald": "0 0 24px -4px rgb(16 185 129 / 0.4)",
        "glow-brand":   "0 0 24px -4px rgb(20 32 156 / 0.35)",
        inner:     "inset 0 2px 4px 0 rgb(0 0 0 / 0.06)",
        "inner-brand": "inset 0 2px 4px 0 rgb(20 32 156 / 0.08)",
        none:      "none",
      },

      backgroundImage: {
        "gradient-brand":   "linear-gradient(135deg, #14209C 0%, #2a4ed6 100%)",
        "gradient-emerald": "linear-gradient(135deg, #059669 0%, #10B981 100%)",
        "gradient-gold":    "linear-gradient(135deg, #e9a706 0%, #F9C31C 100%)",
        "gradient-hero":    "linear-gradient(135deg, #0f172a 0%, #14209C 50%, #1b38be 100%)",
        "gradient-radial":  "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
        "gradient-conic":   "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "shimmer":          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
      },

      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          "0%":   { opacity: "0", transform: "scale(0.97) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-down": {
          "0%":   { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%":      { transform: "translateY(-12px) rotate(2deg)" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(1)",   opacity: "0.6" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% center" },
          to:   { backgroundPosition: " 200% center" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "bounce-x": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%":      { transform: "translateX(4px)" },
        },
      },

      animation: {
        "fade-in":       "fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-scale": "fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-down":    "slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-up":      "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        float:           "float 3s ease-in-out infinite",
        "float-slow":    "float-slow 5s ease-in-out infinite",
        "pulse-ring":    "pulse-ring 1.5s ease-out infinite",
        shimmer:         "shimmer 2.5s linear infinite",
        "spin-slow":     "spin-slow 12s linear infinite",
        "bounce-x":      "bounce-x 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
