/**
 * NOTE: This project uses Tailwind CSS v4, which is configured via CSS rather than JS.
 * The actual Tailwind configuration lives in app/globals.css using @import "tailwindcss"
 * and CSS custom properties. This file exists for reference / tooling compatibility only.
 *
 * Tailwind v4 automatically scans all files in the project for class names.
 * Custom utilities and theme tokens are defined in globals.css.
 *
 * Rating color tokens (defined as CSS variables in globals.css):
 *   --strong-buy: 160 84% 39%   (emerald)
 *   --buy:        142 71% 45%   (green)
 *   --hold:       45 93% 47%    (amber)
 *   --sell:       25 95% 53%    (orange)
 *   --strong-sell: 0 72% 51%   (red)
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        'strong-buy': 'hsl(var(--strong-buy) / <alpha-value>)',
        buy: 'hsl(var(--buy) / <alpha-value>)',
        hold: 'hsl(var(--hold) / <alpha-value>)',
        sell: 'hsl(var(--sell) / <alpha-value>)',
        'strong-sell': 'hsl(var(--strong-sell) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
