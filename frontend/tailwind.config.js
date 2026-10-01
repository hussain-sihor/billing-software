/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Ported from the current :root theme in public/index.html
        navy: {
          DEFAULT: '#132A4C',
          2: '#1E3E68'
        },
        paper: '#FFFFFF',
        appbg: '#F3F5F8',
        bordr: {
          DEFAULT: '#D7DEE8',
          strong: '#AAB6C6'
        },
        ink: '#1E293B',
        muted: '#67758C',
        accent: {
          DEFAULT: '#0E7C6B',
          dark: '#0A5F52'
        },
        danger: {
          DEFAULT: '#B3261E',
          bg: '#FDEEEC'
        },
        amber: '#9A6A00'
      }
    }
  },
  plugins: []
};
