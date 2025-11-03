/**
 * Reusable Button Component
 * Enhanced with micro-interactions and WCAG AAA accessibility
 */

import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonButtonProps = ButtonBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonLinkProps = ButtonBaseProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> & { href: string };

type ButtonProps = ButtonButtonProps | ButtonLinkProps;

const BASE_CLASSES = `
  font-semibold rounded-xl transition-all duration-300 
  focus:outline-none focus:ring-3 focus:ring-offset-2 
  disabled:opacity-50 disabled:cursor-not-allowed 
  shadow-sm hover:shadow-medium active:scale-[0.98]
  ripple-effect hover-lift button-press
  inline-flex items-center justify-center gap-2
`;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
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

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

function LoadingIndicator() {
  return (
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
  );
}

export function Button(props: ButtonProps) {
  if ('href' in props && props.href) {
    const {
      href,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      className,
      children,
      disabled,
      onClick,
      ...anchorProps
    } = props as ButtonLinkProps;

    const classes = clsx(
      BASE_CLASSES,
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      fullWidth && 'w-full',
      className
    );

    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || loading}
        onClick={(event) => {
          if (disabled || loading) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        {...anchorProps}
      >
        {loading ? <LoadingIndicator /> : children}
      </Link>
    );
  }

  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    className,
    children,
    type = 'button',
    disabled,
    ...buttonProps
  } = props as ButtonButtonProps;

  const classes = clsx(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && 'w-full',
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      type={type}
      {...buttonProps}
    >
      {loading ? <LoadingIndicator /> : children}
    </button>
  );
}
