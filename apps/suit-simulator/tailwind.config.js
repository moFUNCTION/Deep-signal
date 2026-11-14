/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui-kit/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sky: {
          DEFAULT: '#3B82F6',
          bright: '#60A5FA',
          deep: '#1D4ED8',
          soft: '#DBEAFE',
        },
        sun: {
          DEFAULT: '#FBBF24',
          bright: '#FCD34D',
          deep: '#D97706',
        },
        leaf: {
          DEFAULT: '#22C55E',
          soft: '#DCFCE7',
          deep: '#16A34A',
        },
        coral: {
          DEFAULT: '#F87171',
          soft: '#FEE2E2',
        },
        berry: {
          DEFAULT: '#A855F7',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          elevated: '#FFFFFF',
          sunken: '#F1F5F9',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#475569',
          subtle: '#94A3B8',
          faint: '#CBD5E1',
        },
        outline: {
          DEFAULT: '#E2E8F0',
          strong: '#94A3B8',
        },
      },
      fontFamily: {
        display: ['"Hubot Sans"', 'Nunito', 'Quicksand', 'sans-serif'],
        body: ['"Atkinson Hyperlegible"', '"Nunito Sans"', 'Inter', 'sans-serif'],
        reading: ['"Lexend Deca"', '"Source Serif 4"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        btn: '16px',
        input: '12px',
        modal: '28px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(15, 23, 42, 0.04)',
        cardHover: '0 8px 24px rgba(15, 23, 42, 0.08)',
        cardActive: '0 12px 32px rgba(59, 130, 246, 0.15)',
        glowSun: '0 0 24px rgba(251, 191, 36, 0.45)',
        glowSky: '0 0 24px rgba(59, 130, 246, 0.35)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
