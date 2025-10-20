/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Modern sky blue (trustworthy & calming)
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          DEFAULT: '#0EA5E9',
          light: '#38BDF8',
          dark: '#0284C7',
        },
        secondary: {
          50: '#FDF4FF',
          100: '#FAE8FF',
          200: '#F5D0FE',
          300: '#F0ABFC',
          400: '#E879F9',
          500: '#D946EF', // Vibrant magenta accent
          600: '#C026D3',
          700: '#A21CAF',
          800: '#86198F',
          900: '#701A75',
          DEFAULT: '#D946EF',
          light: '#E879F9',
          dark: '#C026D3',
        },
        warm: {
          coral: '#FF6B9D',
          sunset: '#FF8A5B',
          amber: '#FFC078',
          peach: '#FFE5B4',
          rose: '#FFB7CE',
          gold: '#FFD700',
        },
        accent: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          pink: '#EC4899',
          teal: '#14B8A6',
          sky: '#0EA5E9',
          rose: '#F43F5E',
          purple: '#9B59B6',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          DEFAULT: '#71717A',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.7)',
          dark: 'rgba(24, 24, 27, 0.7)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
        medium: '0 4px 16px rgba(0, 0, 0, 0.08)',
        large: '0 8px 32px rgba(0, 0, 0, 0.12)',
        glow: '0 0 30px rgba(14, 165, 233, 0.4)',
        neon: '0 0 50px rgba(217, 70, 239, 0.5)',
        card: '0 4px 24px rgba(0, 0, 0, 0.05)',
        warm: '0 10px 40px rgba(255, 138, 91, 0.25)',
        medical: '0 8px 30px rgba(14, 165, 233, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #D946EF 0%, #E879F9 100%)',
        'gradient-info': 'linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #22D3EE 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF8A5B 0%, #FF6B9D 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FF8A5B 0%, #FFD700 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
      },
      transitionTimingFunction: {
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-in-out',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [
    // Uncomment after restarting Docker containers
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/aspect-ratio'),
  ],
};
