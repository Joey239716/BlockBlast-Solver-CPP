import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#080810',
          surface: '#0f0f1e',
          elevated: '#14142a',
        },
        accent: {
          cyan: '#00d4ff',
          purple: '#9b5cff',
          coral: '#ff6b6b',
          lime: '#39ff88',
          orange: '#ff9f43',
        },
      },
      fontFamily: {
        sans:  ['Chakra Petch', 'system-ui', 'sans-serif'],
        russo: ['Russo One', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      maxWidth: { page: '600px' },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 1.2s linear infinite',
        'fade-in': 'fadeIn 200ms ease forwards',
        'cell-pop': 'cellPop 300ms cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        glowPulse: {
          '0%,100%': {
            boxShadow:
              '0 0 16px rgba(0,212,255,0.2), 0 0 32px rgba(155,92,255,0.1)',
          },
          '50%': {
            boxShadow:
              '0 0 36px rgba(0,212,255,0.55), 0 0 72px rgba(155,92,255,0.35)',
          },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        cellPop: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
}

export default config
