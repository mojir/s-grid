/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        lightSelection: {
          DEFAULT: '#ccd',
        },
        darkSelection: {
          DEFAULT: '#323F5B',
        },
      },
    },
  },
  plugins: [
    ({ addUtilities }) => {
      addUtilities({
        '.no-scrollbar': {
          /* Hide scrollbar in WebKit-based browsers (Chrome, Safari, Edge) */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          /* Hide scrollbar in Firefox */
          'scrollbar-width': 'none',
          /* Hide scrollbar in IE and old Edge */
          '-ms-overflow-style': 'none',
        },
        '.sidepanel-shadow': {
          'box-shadow': '0 0 20px black',
        },
      })
    },
  ],
  darkMode: 'class',
}
