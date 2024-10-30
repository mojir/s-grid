/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {},
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
        '.bg-selection': {
          'background-color': '#323F5B',
        },
        '.bg-header-selection': {
          'background-color': '#323F5B',
        },
        '.sidepanel-shadow': {
          'box-shadow': '0 0 20px black',
        },
      })
    },
  ],
  darkMode: 'class',
}
