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

        // Every shade comes from the two brand colours in Site settings (see cms/brand.ts).
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
          950: "rgb(var(--brand-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--brand-700) / <alpha-value>)",
        },
        accent: {
          50: "rgb(var(--accent-50) / <alpha-value>)",
          100: "rgb(var(--accent-100) / <alpha-value>)",
          200: "rgb(var(--accent-200) / <alpha-value>)",
          300: "rgb(var(--accent-300) / <alpha-value>)",
          400: "rgb(var(--accent-400) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
          700: "rgb(var(--accent-700) / <alpha-value>)",
          800: "rgb(var(--accent-800) / <alpha-value>)",
          900: "rgb(var(--accent-900) / <alpha-value>)",
          950: "rgb(var(--accent-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--accent-400) / <alpha-value>)",
          foreground: "#020617",
        },
        primary: {
          DEFAULT: "rgb(var(--brand-700) / <alpha-value>)",
          foreground: "#ffffff",
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
          950: "rgb(var(--brand-950) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:    "rgb(var(--accent-400) / <alpha-value>)",
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
        card:      "0 4px 6px -1px rgb(var(--brand-700) / 0.05), 0 2px 4px -2px rgb(var(--brand-700) / 0.03)",
        elevation: "0 12px 24px -6px rgb(var(--brand-700) / 0.1), 0 4px 8px -4px rgb(var(--brand-700) / 0.05)",
        "elevation-lg": "0 24px 48px -12px rgb(var(--brand-700) / 0.14), 0 8px 16px -8px rgb(var(--brand-700) / 0.06)",
        glow:      "0 0 24px -4px rgb(var(--accent-400) / 0.45)",
        "glow-emerald": "0 0 24px -4px rgb(16 185 129 / 0.4)",
        "glow-brand":   "0 0 24px -4px rgb(var(--brand-700) / 0.35)",
        inner:     "inset 0 2px 4px 0 rgb(0 0 0 / 0.06)",
        "inner-brand": "inset 0 2px 4px 0 rgb(var(--brand-700) / 0.08)",
        none:      "none",
      },

      backgroundImage: {
        "gradient-brand":   "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-light) 100%)",
        "gradient-emerald": "linear-gradient(135deg, #059669 0%, #10B981 100%)",
        "gradient-gold":    "linear-gradient(135deg, var(--brand-accent-dark) 0%, var(--brand-accent) 100%)",
        "gradient-hero":    "linear-gradient(135deg, rgb(var(--brand-950)) 0%, var(--brand-primary) 60%, var(--brand-primary-light) 100%)",
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
