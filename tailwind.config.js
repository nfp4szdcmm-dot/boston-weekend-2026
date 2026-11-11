/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#14213d', 50: '#eef1f7', 100: '#d9dfec', 600: '#22345c', 700: '#1a2948', 800: '#14213d', 900: '#0d1629' },
        harbor: '#1d4e89',
        brick: '#a3472f',
        cream: '#f7f2ea',
        sand: '#ece3d4',
        gold: '#c9a227',
        ink: '#1f2430',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,33,61,.06), 0 6px 24px -8px rgba(20,33,61,.18)',
        float: '0 10px 30px -10px rgba(20,33,61,.45)',
      },
    },
  },
  plugins: [],
};
