/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        monad: {
          pink: '#f357a8',
          purple: '#7b2ff2',
          deep: '#b90c9f',
          note: '#e302f7',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
};
