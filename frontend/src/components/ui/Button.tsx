/**
 * Reusable Button Component
 * Enhanced with micro-interactions and WCAG AAA accessibility
 */

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = `
    font-semibold rounded-xl transition-all duration-300 
    focus:outline-none focus:ring-3 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed 
    shadow-sm hover:shadow-medium active:scale-[0.98]
    ripple-effect hover-lift button-press
    inline-flex items-center justify-center gap-2
  `;
  
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600 
      dark:from-primary-400 dark:to-primary-500
      text-white 
      hover:from-primary-600 hover:to-primary-700 
      dark:hover:from-primary-500 dark:hover:to-primary-600
      focus:ring-primary-500 dark:focus:ring-primary-400
      shadow-medical hover:shadow-large
    `,
    secondary: `
      bg-gradient-to-r from-secondary-500 to-secondary-600 
      dark:from-secondary-400 dark:to-secondary-500
      text-white 
      hover:from-secondary-600 hover:to-secondary-700 
      dark:hover:from-secondary-500 dark:hover:to-secondary-600
      focus:ring-secondary-500 dark:focus:ring-secondary-400
      shadow-medium
    `,
    outline: `
      bg-white dark:bg-neutral-800 
      text-primary-600 dark:text-primary-400 
      border-2 border-primary-500 dark:border-primary-400 
      hover:bg-primary-50 dark:hover:bg-primary-900/20 
      hover:border-primary-600 dark:hover:border-primary-300
      focus:ring-primary-500 dark:focus:ring-primary-400
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 
      dark:from-red-400 dark:to-red-500
      text-white 
      hover:from-red-600 hover:to-red-700 
      dark:hover:from-red-500 dark:hover:to-red-600
      focus:ring-red-500 dark:focus:ring-red-400
      shadow-medium
    `,
    ghost: `
      bg-transparent 
      text-primary-600 dark:text-primary-400 
      hover:bg-primary-50 dark:hover:bg-primary-900/20 
      focus:ring-primary-500 dark:focus:ring-primary-400
    `,
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin h-5 w-5" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
          <span>Chargement...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
