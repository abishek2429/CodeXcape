/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0d14',
          card: '#121824',
          border: '#1e293b',
          accent: '#00f0ff',
          neonGreen: '#00ff88',
          neonRed: '#ff0055',
          muted: '#64748b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.6))' },
          '50%': { opacity: 0.7, filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.2))' },
        },
      },
    },
  },
  plugins: [],
};
