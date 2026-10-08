/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ee', 100: '#d7ecd7', 200: '#b2d9b4', 300: '#84c08a',
          400: '#54a35e', 500: '#2e7d32', 600: '#256829', 700: '#1f5423',
          800: '#1b441e', 900: '#173819',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
