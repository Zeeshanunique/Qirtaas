/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B4513', // Saddle Brown
        secondary: '#DAA520', // Goldenrod
        accent: '#4A3728', // Dark Brown
        beige: '#F5F5DC', // Beige
        sand: '#F4A460', // Sandy Brown
      },
      fontFamily: {
        playfair: ['var(--font-playfair)'],
        arabic: ['var(--font-arabic)'], // Add an Arabic font
      },
      backgroundImage: {
        'parchment': "url('/textures/parchment.png')", // Add parchment texture
      }
    },
  },
  plugins: [],
}