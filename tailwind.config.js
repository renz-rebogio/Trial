/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
    './index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        "accent-warm": {
          DEFAULT: "hsl(var(--accent-warm))",
          foreground: "hsl(var(--accent-warm-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "clean-white": { 
          DEFAULT: "hsl(var(--clean-white))",
          foreground: "hsl(var(--clean-white-foreground))",
          "muted-foreground": "hsl(var(--clean-white-muted-foreground))",
          border: "hsl(var(--clean-white-border))",
        },
        "feed-primary": "hsl(var(--feed-primary))",
        "feed-secondary": "hsl(var(--feed-secondary))",
        "feed-card-bg": "hsl(var(--feed-card-bg))",
        "feed-card-fg": "hsl(var(--feed-card-fg))",
        "feed-accent-orange": "hsl(var(--feed-accent-orange))",
        "feed-accent-pink": "hsl(var(--feed-accent-pink))",
        // Adding Boogasi specific colors here for Tailwind utility generation
        "boogasi-blue": "hsl(var(--boogasi-blue))",
        "boogasi-red": "hsl(var(--boogasi-red))",
        "boogasi-yellow": "hsl(var(--boogasi-yellow))",
        "boogasi-green": "hsl(var(--boogasi-green))",
        "boogasi-cyan": "hsl(var(--boogasi-cyan))",
        "boogasi-purple": "hsl(var(--boogasi-purple))",
        "boogasi-pink": "hsl(var(--boogasi-pink))",
        "boogasi-orange": "hsl(var(--boogasi-orange))",
        "boogasi-black": "hsl(var(--boogasi-black))",
        "boogasi-white": "hsl(var(--boogasi-white))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'], /* Keep if used, otherwise can remove */
        mono: ['Roboto Mono', 'Consolas', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}