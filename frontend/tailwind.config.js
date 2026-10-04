/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFF9F5',
        peach: {
          50: '#FFF7F2',
          100: '#FFEFE6',
          200: '#FFE2D5',
          300: '#FFC8B3',
          400: '#FFAD8E',
          500: '#FF986F', // Coral accent
          600: '#F28254',
          700: '#D96536',
        },
        coral: {
          light: '#FFAF8D',
          DEFAULT: '#FF986F',
          dark: '#E67A50',
          hover: '#F28254',
        },
        charcoal: {
          DEFAULT: '#292526',
          muted: '#898487',
          light: '#B3AEB1',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          warm: '#FAF4EF',
          border: '#F0E4DE',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(220, 200, 190, 0.15)',
        'warm': '0 8px 24px rgba(230, 210, 200, 0.28)',
        'warm-lg': '0 12px 36px rgba(225, 200, 190, 0.35)',
        'dock': '0 10px 30px rgba(100, 70, 60, 0.12)',
      },
    },
  },
  plugins: [],
}
