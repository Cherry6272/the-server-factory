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
          DEFAULT: '#0066CC',
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#B9DCFE',
          300: '#7CBFFD',
          400: '#389EF9',
          500: '#0066CC',
          600: '#0052A3',
          700: '#0A3B73',
          800: '#0B2D54',
          900: '#0B2545',
          950: '#061527',
        },
        techgreen: {
          DEFAULT: '#72BF24',
          50: '#F4FBEA',
          100: '#E5F7CE',
          200: '#CCF0A2',
          300: '#ADE46E',
          400: '#8ED438',
          500: '#72BF24',
          600: '#5A9E19',
          700: '#457A16',
          800: '#396216',
          900: '#2E4F14',
        },
        navy: {
          DEFAULT: '#0B2545',
          50: '#F0F4F8',
          100: '#D9E3ED',
          200: '#B3C7DC',
          300: '#8DABCB',
          400: '#4D7DAE',
          500: '#1D5B9B',
          600: '#13477F',
          700: '#0E3663',
          800: '#0B2D54',
          900: '#0B2545',
          950: '#061527',
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
        brand: '0 10px 25px -5px rgba(0, 102, 204, 0.35)',
        techgreen: '0 10px 25px -5px rgba(114, 191, 36, 0.35)',
        glow: '0 0 25px -3px rgba(114, 191, 36, 0.45)',
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
