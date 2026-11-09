/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brown/Warm theme colors
        brown: {
          50: '#FFF8F0',
          100: '#FFE5D4',
          200: '#FFD4B3',
          300: '#F5E6D3',
          400: '#E8D5C4',
          500: '#CD853F',
          600: '#A0522D',
          700: '#8B4513',
          800: '#654321',
          900: '#3C2414',
        },
        orange: {
          50: '#FFF5E6',
          100: '#FFE5CC',
          200: '#FFD4B3',
          300: '#FFC299',
          400: '#FFB080',
          500: '#FF8C42',
          600: '#FF7A2E',
          700: '#E6732A',
          800: '#CC5C1F',
          900: '#B34514',
        },
        peach: {
          50: '#FFF8F0',
          100: '#FFE5D4',
          200: '#FFD4B3',
          300: '#FFC299',
          400: '#FFB080',
          500: '#FFA366',
        },
        primary: {
          50: '#FFF8F0',
          100: '#FFE5D4',
          200: '#FFD4B3',
          300: '#F5E6D3',
          400: '#E8D5C4',
          500: '#CD853F',
          600: '#A0522D',
          700: '#8B4513',
          800: '#654321',
          900: '#3C2414',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
