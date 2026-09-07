import type { Config } from 'tailwindcss';

// Design tokens — see src/app/globals.css for the rationale.
// Palette: warm stone neutrals + "diagnostic teal" primary + amber/green/red status colors.
// Avoids the generic cold-gray/blue "AI SaaS" look. A geometric display face (Space Grotesk)
// paired with a plain-spoken sans body (Inter) gives headings a precise, engineered feel.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#1C1917',
          900: '#292420',
          800: '#3A332C',
          600: '#5C5346',
          400: '#948A79',
          200: '#DDD6C7',
          100: '#F0EBE1',
          50: '#FAF7F1',
        },
        teal: {
          700: '#0A5F64',
          600: '#0C7C82',
          500: '#0E969D',
          100: '#DBEEEF',
          50: '#EFF7F7',
        },
        amber: {
          700: '#9C5F17',
          600: '#C97A22',
          100: '#F6E4CC',
          50: '#FBF2E6',
        },
        green: {
          700: '#23703F',
          600: '#2F8F5B',
          100: '#D9EFE2',
          50: '#EFF9F3',
        },
        red: {
          700: '#9C332A',
          600: '#C4453A',
          100: '#F6DAD7',
          50: '#FBEEEC',
        },
        // Semantic aliases so new code reaches for meaning, not a raw scale name.
        success: {
          700: '#23703F',
          600: '#2F8F5B',
          100: '#D9EFE2',
          50: '#EFF9F3',
        },
        warning: {
          700: '#9C5F17',
          600: '#C97A22',
          100: '#F6E4CC',
          50: '#FBF2E6',
        },
        danger: {
          700: '#9C332A',
          600: '#C4453A',
          100: '#F6DAD7',
          50: '#FBEEEC',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      fontFeatureSettings: {
        tabular: '"tnum" 1, "lnum" 1',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        // Large panels: modals, drawers, command palette.
        lg: '14px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(28 25 23 / 0.05), 0 1px 1px -1px rgb(28 25 23 / 0.04)',
        crafted: '0 4px 16px -4px rgb(28 25 23 / 0.10), 0 1px 2px 0 rgb(28 25 23 / 0.05)',
        elevated: '0 12px 32px -8px rgb(28 25 23 / 0.16), 0 2px 8px -2px rgb(28 25 23 / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 220ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
