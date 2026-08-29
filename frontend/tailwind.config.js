/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#05070d',
          dark: '#080b12',
          surface: '#0d111c',
          panel: '#121828',
          card: '#151c2e',
          border: '#1e293b',
          borderLight: '#334155',
          cyan: '#00f0ff',
          cyanGlow: 'rgba(0, 240, 255, 0.4)',
          purple: '#a855f7',
          purpleGlow: 'rgba(168, 85, 247, 0.4)',
          emerald: '#10b981',
          emeraldGlow: 'rgba(16, 185, 129, 0.4)',
          amber: '#f59e0b',
          rose: '#f43f5e',
          muted: '#64748b',
          textMuted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'cyan-sm': '0 0 10px rgba(0, 240, 255, 0.2)',
        'cyan-md': '0 0 20px rgba(0, 240, 255, 0.3)',
        'cyan-lg': '0 0 35px rgba(0, 240, 255, 0.4)',
        'purple-md': '0 0 20px rgba(168, 85, 247, 0.3)',
        'emerald-md': '0 0 20px rgba(16, 185, 129, 0.3)',
        'hud': 'inset 0 0 20px rgba(0, 240, 255, 0.05), 0 0 15px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'terminal-blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.5))' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.2))' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
