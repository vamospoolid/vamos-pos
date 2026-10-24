/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          DEFAULT: '#1E2875',
          light: '#2538D4',
          dark: '#141C52',
          subtle: '#EEF2FF',
        },
        canvas: '#F5F7FC',
        surface: '#FFFFFF',
        gold: {
          start: '#FF9F2E',
          end: '#FF5E14',
        },
        vamos: {
          neon: '#00ff66',
          dark: '#0a0a0a',
          card: '#141414',
          border: '#222222',
          cyan: '#00e5ff',
          orange: '#ff9900',
          purple: '#b829ea'
        }
      },
      boxShadow: {
        'card': '0 8px 30px -4px rgba(30, 40, 117, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'float': '0 12px 36px -4px rgba(30, 40, 117, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'royal': '0 10px 25px -3px rgba(37, 56, 212, 0.35)',
        'gold': '0 10px 25px -3px rgba(255, 94, 20, 0.35)',
      }
    },
  },
  plugins: [],
}
