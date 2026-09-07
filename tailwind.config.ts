import type { Config } from 'tailwindcss';

// Design tokens — see src/app/globals.css for the rationale.
// Palette: warm stone neutrals + "diagnostic teal" primary + amber/green/red status colors.
// Avoids the generic cold-gray/blue "AI SaaS" look; a serif display face (Fraunces) paired
// with a plain-spoken sans body gives the counter tool an editorial, hand-built feel rather
// than a template one.
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
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      fontFeatureSettings: {
        tabular: '"tnum" 1, "lnum" 1',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '5px',
        md: '7px',
        lg: '10px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(28 25 23 / 0.05), 0 1px 1px -1px rgb(28 25 23 / 0.04)',
        crafted: '0 4px 16px -4px rgb(28 25 23 / 0.10), 0 1px 2px 0 rgb(28 25 23 / 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
