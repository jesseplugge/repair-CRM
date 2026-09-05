import type { Config } from 'tailwindcss';

// Design tokens — see src/app/globals.css for the rationale.
// Palette: graphite/ink neutrals + "diagnostic teal" primary + amber/green/red status colors.
// Avoids the generic cream/terracotta and default-SaaS-blue looks; built for a dense,
// fast-moving repair-shop counter tool rather than a marketing site.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#14171C',
          900: '#1E2229',
          800: '#2A2F38',
          600: '#495164',
          400: '#8A93A6',
          200: '#C7CCD6',
          100: '#EDEFF3',
          50: '#F7F8FA',
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
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      fontFeatureSettings: {
        tabular: '"tnum" 1, "lnum" 1',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(20 23 28 / 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
