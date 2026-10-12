/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#17202a',
        panel: '#f6f7f2',
        line: '#d7ddd2',
        brand: '#176b5f',
        accent: '#b6413a',
      },
    },
  },
  plugins: [],
};
