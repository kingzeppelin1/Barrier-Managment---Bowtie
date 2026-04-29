import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Bowtie semantic status colors
        status: {
          green: 'hsl(var(--status-green))',
          yellow: 'hsl(var(--status-yellow))',
          red: 'hsl(var(--status-red))',
          gray: 'hsl(var(--status-gray))',
          blue: 'hsl(var(--status-blue))',
          purple: 'hsl(var(--status-purple))',
        },
        // STAR Design System palette (use sparingly — prefer the semantic
        // aliases above; reach for `star-*` only when a STAR-specific
        // surface needs the brand hue directly).
        star: {
          navy: 'hsl(var(--star-navy))',
          teal: 'hsl(var(--star-teal))',
          mint: 'hsl(var(--star-mint))',
          'mint-soft': 'hsl(var(--star-mint-soft))',
          sky: 'hsl(var(--star-sky))',
          'sky-soft': 'hsl(var(--star-sky-soft))',
          orange: 'hsl(var(--star-orange))',
          'orange-soft': 'hsl(var(--star-orange-soft))',
          // STAR-extension status red — see globals.css for usage rules.
          'status-red': 'hsl(var(--star-status-red))',
          'status-red-bg': 'hsl(var(--star-status-red-bg))',
          'status-red-border': 'hsl(var(--star-status-red-border))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
