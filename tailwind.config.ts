import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // Small phones (iPhone SE / Galaxy S-mini are 320–375px) get the base styles;
        // `xs` is the first step up, `3xl` targets wide desktop and ultrawide monitors.
        xs: '475px',
        '3xl': '1920px',
      },
      colors: {
        brand: {
  DEFAULT: '#7C3AED',
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#6D28D9',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
},
        ink: {
          DEFAULT: '#0B1220',
          soft: '#1f2937',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        brand: '0 10px 25px -5px rgba(124, 58, 237, 0.35)',
        soft: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
