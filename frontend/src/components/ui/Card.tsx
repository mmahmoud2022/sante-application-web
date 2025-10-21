/**
 * Card Component
 * Enhanced with dark mode support and accessibility features
 */

import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  as?: 'div' | 'article' | 'section';
}

export function Card({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  hover = false,
  as: Component = 'div',
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-soft',
    md: 'shadow-medium',
    lg: 'shadow-large',
  };

  return (
    <Component
      className={clsx(
        'bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700',
        'transition-all duration-300',
        paddingStyles[padding],
        shadowStyles[shadow],
        hover && 'hover:shadow-hover hover:border-primary-200 dark:hover:border-primary-700 cursor-pointer hover-lift',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-700', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function CardTitle({ children, className, as: Component = 'h3' }: CardTitleProps) {
  return (
    <Component className={clsx('text-xl font-heading font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2', className)}>
      {children}
    </Component>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={clsx('text-neutral-600 dark:text-neutral-300', className)}>{children}</div>;
}
