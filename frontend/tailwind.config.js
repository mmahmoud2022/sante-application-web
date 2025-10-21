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
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Vert émeraude
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Bleu médical
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
        warm: {
          coral: '#f97316', // Accent corail
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
        'gradient-primary': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        'gradient-info': 'linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #22D3EE 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f97316 0%, #FB923C 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FF8A5B 0%, #FFD700 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
        'gradient-glass-dark':
          'linear-gradient(135deg, rgba(24,24,27,0.7) 0%, rgba(24,24,27,0.4) 100%)',
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
