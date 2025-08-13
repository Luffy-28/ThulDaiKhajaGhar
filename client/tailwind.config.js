/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'saffron-red': '#FF2400',
        'himalayan-white': '#F5F6F5',
        'evergreen': '#0A5C36',
        'marigold-yellow': '#FFC107',
        'slate-blue': '#4682B4',
      },
    },
  },
  plugins: [],
};