/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#c84031',
          hover: '#b03527',
          light: '#fdf2f0',
        },
        sepia: {
          bg: '#F5EBD7',
          card: '#EFE2C6',
          border: '#DFCEAA',
          text: '#3B2F2F',
          muted: '#6E5D4F',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
