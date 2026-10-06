/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: 'rgb(var(--color-blue) / <alpha-value>)',
          deep: 'rgb(var(--color-blue-deep) / <alpha-value>)',
          soft: 'rgb(var(--color-blue-soft) / <alpha-value>)',
        },
        green: {
          DEFAULT: 'rgb(var(--color-green) / <alpha-value>)',
          bright: 'rgb(var(--color-green-bright) / <alpha-value>)',
        },
        gray: 'rgb(var(--color-gray) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
        },
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          soft: 'rgb(var(--color-surface-soft) / <alpha-value>)',
          blue: 'rgb(var(--color-surface-blue) / <alpha-value>)',
        },
        line: 'rgb(var(--color-line) / <alpha-value>)',
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          soft: 'rgb(var(--color-warning-soft) / <alpha-value>)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans: ['Manrope'],
      },
    },
  },
  plugins: [],
};
