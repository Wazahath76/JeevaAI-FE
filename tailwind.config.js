/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B18', 900: '#0A0F1E', 800: '#0F1629',
          700: '#131929', 600: '#1A2236', 500: '#1E2A3E', 400: '#2A3A54',
        },
        teal: { 400: '#2DD4BF', 500: '#00C6B3', 600: '#00A896' },
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn:   { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 12px rgba(0,198,179,0.15)',
        'glow-teal':  '0 0 24px rgba(0,198,179,0.4)',
      },
    },
  },
  plugins: [],
}
