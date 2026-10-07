/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ibm: {
          blue: '#0f62fe',
          'blue-dark': '#0043ce',
          'blue-light': '#4589ff',
          gray: '#161616',
          'gray-medium': '#393939',
          'gray-light': '#6f6f6f',
          'gray-100': '#f4f4f4',
          'gray-200': '#e0e0e0',
          cyan: '#1192e8',
          teal: '#009d9a',
          purple: '#8a3ffc',
          magenta: '#ee5396',
          green: '#24a148',
          red: '#da1e28',
          yellow: '#f1c21b',
          orange: '#ff7eb6',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
      }
    },
  },
  plugins: [],
}
