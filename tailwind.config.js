/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#cabffd',
          400: '#a78bfa',
          500: '#8b7cff', // Primary gradient start
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        secondary: '#6D4FFF', // Primary gradient end
        dark: '#0B0B0E',
        light: '#F3F4F6',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8B7CFF 0%, #6D4FFF 100%)',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
