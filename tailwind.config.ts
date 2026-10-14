import type { Config } from 'tailwindcss';

// Design tokens — "repair bench" identity.
// Neutrals are cool and paper-like (a job tag on a device), the dark surface is the
// blue-grey of an anti-static mat, and one tool-handle yellow ("signal") marks the
// few things that need hands now: starting a repair and handing one back.
// The per-business --accent stays a readable deep blue because it is used for link
// text and white-on-accent buttons all over the app; yellow is never used for text.
// One type family (Archivo) carries everything; headings and big numbers use its
// expanded width (see .font-display in globals.css) instead of a second typeface.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#16222A',
          900: '#1E2C33',
          800: '#2C3C44',
          600: '#4D5E66',
          400: '#6C7D84',
          200: '#D3DBDD',
          100: '#E7ECED',
          50: '#F4F6F5',
        },
        mat: {
          DEFAULT: '#22343B',
          700: '#1A2930',
        },
        signal: {
          600: '#C9971A',
          500: '#E9B425',
          100: '#FBF0D0',
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
        sans: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
        display: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
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
        card: '0 1px 2px 0 rgb(22 34 42 / 0.05), 0 1px 1px -1px rgb(22 34 42 / 0.04)',
        crafted: '0 4px 16px -4px rgb(22 34 42 / 0.10), 0 1px 2px 0 rgb(22 34 42 / 0.05)',
        elevated: '0 12px 32px -8px rgb(22 34 42 / 0.16), 0 2px 8px -2px rgb(22 34 42 / 0.08)',
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
