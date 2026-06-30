import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Design system tokens
        bg: {
          primary: '#080910',
          surface: '#0f1117',
          elevated: '#161820',
          card: '#1a1c26',
        },
        text: {
          primary: '#f0f2ff',
          secondary: '#8b8fa8',
          muted: '#4a4d6a',
        },
        accent: {
          violet: '#7c5cfc',
          'violet-light': '#9d7dff',
          'violet-dim': 'rgba(124,92,252,0.15)',
          cyan: '#06b6d4',
          'cyan-dim': 'rgba(6,182,212,0.15)',
        },
        guardian: {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d5caff',
          300: '#b8a3ff',
          400: '#9d7dff',
          500: '#7c5cfc',
          600: '#6438f0',
          700: '#5427dc',
          800: '#4620b8',
          900: '#3b1d96',
          950: '#230f61',
        },
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(124,92,252,0.35)',
        'glow-violet-sm': '0 0 10px rgba(124,92,252,0.2)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'orbit': 'orbit 3s linear infinite',
        'orbit-reverse': 'orbit 2s linear infinite reverse',
        'spin-slow': 'spin 4s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(124,92,252,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(124,92,252,0.6), 0 0 80px rgba(124,92,252,0.2)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(28px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(28px) rotate(-360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
